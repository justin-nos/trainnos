-- One-shot import of production Firestore, run by scripts/importFirestore.mjs
-- right after the cutover deploy. Rows are snake_case column objects:
--   {leads: [...], testimonials: [...], email_signups: [...],
--    sessions: [...], events: [...], daily: {"2026-10-28": {...tree}}}
-- Analytics are *added* onto whatever Supabase collected since the deploy,
-- so it must run exactly once (import_runs marker).
create or replace function public.import_firestore(p jsonb)
returns jsonb language plpgsql as $$
declare
  n_leads int; n_testimonials int; n_emails int;
  n_events int; n_sessions int; n_daily int;
  summary jsonb;
begin
  if exists (select 1 from public.import_runs where name = 'firestore') then
    raise exception 'Firestore import already ran';
  end if;

  insert into public.leads (id, first_name, phone, consent, answers,
    recommendation, status, source, attribution, created_at, updated_at)
  select id, first_name, phone, consent, answers, recommendation,
         coalesce(status, 'new'), source, coalesce(attribution, '{}'),
         coalesce(created_at, now()), updated_at
  from jsonb_to_recordset(coalesce(p -> 'leads', '[]')) as r(
    id text, first_name text, phone text, consent boolean, answers jsonb,
    recommendation jsonb, status text, source text, attribution jsonb,
    created_at timestamptz, updated_at timestamptz)
  on conflict do nothing;
  get diagnostics n_leads = row_count;

  insert into public.testimonials (id, first_name, last_name, title, text,
    image_path, created_at)
  select id, first_name, last_name, title, text, image_path,
         coalesce(created_at, now())
  from jsonb_to_recordset(coalesce(p -> 'testimonials', '[]')) as r(
    id text, first_name text, last_name text, title text, text text,
    image_path text, created_at timestamptz)
  on conflict do nothing;
  get diagnostics n_testimonials = row_count;

  insert into public.email_signups (email, name)
  select email, name
  from jsonb_to_recordset(coalesce(p -> 'email_signups', '[]')) as r(
    email text, name text)
  on conflict do nothing;
  get diagnostics n_emails = row_count;

  insert into public.analytics_events (env, name, path, props, ts, vid, sid,
    expire_at)
  select 'prod', name, path, coalesce(props, '{}'), ts, vid, sid, expire_at
  from jsonb_to_recordset(coalesce(p -> 'events', '[]')) as r(
    name text, path text, props jsonb, ts timestamptz, vid text, sid uuid,
    expire_at timestamptz);
  get diagnostics n_events = row_count;

  -- A session that straddled the cutover exists on both sides: post-deploy
  -- values win, Firestore fills the gaps, counters add, Firestore's paths
  -- come first.
  insert into public.analytics_sessions as s (id, env, vid, started_at,
    last_seen_at, source, medium, campaign, landing, referrer_host, device,
    geo, pageviews, engaged_ms, paths, reached, "primary", lead_id, expire_at)
  select id, 'prod', vid, started_at, coalesce(last_seen_at, now()), source,
         medium, campaign, landing, referrer_host, device, geo,
         coalesce(pageviews, 0), coalesce(engaged_ms, 0),
         coalesce(paths, '{}'), coalesce(reached, '{}'), "primary", lead_id,
         expire_at
  from jsonb_to_recordset(coalesce(p -> 'sessions', '[]')) as r(
    id uuid, vid text, started_at timestamptz, last_seen_at timestamptz,
    source text, medium text, campaign text, landing text,
    referrer_host text, device text, geo text, pageviews int,
    engaged_ms bigint, paths text[], reached jsonb, "primary" text,
    lead_id text, expire_at timestamptz)
  on conflict (id) do update set
    vid = coalesce(s.vid, excluded.vid),
    started_at = coalesce(excluded.started_at, s.started_at),
    source = coalesce(s.source, excluded.source),
    medium = coalesce(s.medium, excluded.medium),
    campaign = coalesce(s.campaign, excluded.campaign),
    landing = coalesce(s.landing, excluded.landing),
    referrer_host = coalesce(s.referrer_host, excluded.referrer_host),
    device = coalesce(s.device, excluded.device),
    geo = coalesce(s.geo, excluded.geo),
    "primary" = coalesce(s."primary", excluded."primary"),
    lead_id = coalesce(s.lead_id, excluded.lead_id),
    pageviews = s.pageviews + excluded.pageviews,
    engaged_ms = s.engaged_ms + excluded.engaged_ms,
    reached = excluded.reached || s.reached,
    paths = excluded.paths || array(
      select q from unnest(s.paths) with ordinality as t(q, i)
      where q <> all(excluded.paths) order by i),
    last_seen_at = greatest(s.last_seen_at, excluded.last_seen_at),
    expire_at = greatest(s.expire_at, excluded.expire_at);
  get diagnostics n_sessions = row_count;

  select count(*) into n_daily from jsonb_object_keys(coalesce(p -> 'daily', '{}'));
  perform public.analytics_add_daily('prod', p -> 'daily');

  summary := jsonb_build_object(
    'leads', n_leads, 'testimonials', n_testimonials, 'email_signups', n_emails,
    'events', n_events, 'sessions', n_sessions, 'daily', n_daily);
  insert into public.import_runs (name, summary) values ('firestore', summary);
  return summary;
end $$;

revoke execute on function public.import_firestore from public, anon, authenticated;
