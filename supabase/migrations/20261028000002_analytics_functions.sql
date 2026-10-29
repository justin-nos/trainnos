-- Adds numeric leaves of b into a, recursing into objects; anything else in
-- b (e.g. a CTA's kind) overwrites. Mirrors FieldValue.increment trees.
create or replace function public.jsonb_add(a jsonb, b jsonb)
returns jsonb language sql immutable as $$
  select coalesce(a, '{}'::jsonb) || coalesce((
    select jsonb_object_agg(k, case
      when jsonb_typeof(v) = 'number' and jsonb_typeof(a -> k) = 'number'
        then to_jsonb((a ->> k)::numeric + (v #>> '{}')::numeric)
      when jsonb_typeof(v) = 'object' and jsonb_typeof(a -> k) = 'object'
        then public.jsonb_add(a -> k, v)
      else v end)
    from jsonb_each(coalesce(b, '{}'::jsonb)) as e(k, v)
  ), '{}'::jsonb)
$$;

-- p_daily: {"2026-10-28": {...tree}, ...}
create or replace function public.analytics_add_daily(p_env text, p_daily jsonb)
returns void language sql as $$
  insert into public.analytics_daily as d (env, day, data, updated_at)
  select p_env, key::date, value, now() from jsonb_each(coalesce(p_daily, '{}'))
  on conflict (env, day) do update
    set data = public.jsonb_add(d.data, excluded.data), updated_at = now()
$$;

-- One /api/track batch, atomically. p_set holds only the keys buildWrites
-- set; only those columns are overwritten (Firestore merge semantics).
create or replace function public.analytics_track(
  p_env text, p_sid uuid, p_events jsonb, p_set jsonb, p_inc jsonb,
  p_reached jsonb, p_paths text[], p_daily jsonb,
  p_event_expire timestamptz, p_session_expire timestamptz
) returns void language plpgsql as $$
begin
  insert into public.analytics_events (env, name, path, props, ts, vid, sid, expire_at)
  select p_env, e ->> 'name', e ->> 'path', coalesce(e -> 'props', '{}'),
         (e ->> 'ts')::timestamptz, e ->> 'vid', (e ->> 'sid')::uuid, p_event_expire
  from jsonb_array_elements(coalesce(p_events, '[]')) as e;

  insert into public.analytics_sessions as s (
    id, env, vid, started_at, source, medium, campaign, landing, referrer_host,
    device, geo, "primary", pageviews, engaged_ms, reached, paths,
    last_seen_at, expire_at)
  values (
    p_sid, p_env, p_set ->> 'vid', (p_set ->> 'startedAt')::timestamptz,
    p_set ->> 'source', p_set ->> 'medium', p_set ->> 'campaign',
    p_set ->> 'landing', p_set ->> 'referrerHost', p_set ->> 'device',
    p_set ->> 'geo', p_set ->> 'primary',
    coalesce((p_inc ->> 'pageviews')::int, 0),
    coalesce((p_inc ->> 'engagedMs')::bigint, 0),
    coalesce(p_reached, '{}'), coalesce(p_paths, '{}'), now(), p_session_expire)
  on conflict (id) do update set
    vid = case when p_set ? 'vid' then excluded.vid else s.vid end,
    started_at = case when p_set ? 'startedAt' then excluded.started_at else s.started_at end,
    source = case when p_set ? 'source' then excluded.source else s.source end,
    medium = case when p_set ? 'medium' then excluded.medium else s.medium end,
    campaign = case when p_set ? 'campaign' then excluded.campaign else s.campaign end,
    landing = case when p_set ? 'landing' then excluded.landing else s.landing end,
    referrer_host = case when p_set ? 'referrerHost' then excluded.referrer_host else s.referrer_host end,
    device = case when p_set ? 'device' then excluded.device else s.device end,
    geo = case when p_set ? 'geo' then excluded.geo else s.geo end,
    "primary" = case when p_set ? 'primary' then excluded."primary" else s."primary" end,
    pageviews = s.pageviews + excluded.pageviews,
    engaged_ms = s.engaged_ms + excluded.engaged_ms,
    reached = s.reached || excluded.reached,
    paths = s.paths || array(
      select p from unnest(excluded.paths) with ordinality as t(p, i)
      where p <> all(s.paths) order by i),
    last_seen_at = now(),
    expire_at = excluded.expire_at;

  perform public.analytics_add_daily(p_env, p_daily);
end $$;

-- Server-side lead count (buildLeadWrites). The session is updated only if
-- it exists; readAttribution passes null otherwise.
create or replace function public.analytics_record_lead(
  p_env text, p_sid uuid, p_daily jsonb, p_set jsonb, p_reached jsonb
) returns void language plpgsql as $$
begin
  perform public.analytics_add_daily(p_env, p_daily);
  if p_sid is not null then
    update public.analytics_sessions set
      lead_id = coalesce(p_set ->> 'leadId', lead_id),
      "primary" = coalesce(p_set ->> 'primary', "primary"),
      reached = reached || coalesce(p_reached, '{}')
    where id = p_sid;
  end if;
end $$;

revoke execute on function public.jsonb_add, public.analytics_add_daily,
  public.analytics_track, public.analytics_record_lead
  from public, anon, authenticated;
