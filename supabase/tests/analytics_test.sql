begin;
select plan(25);

-- jsonb_add
select is(public.jsonb_add('{"a":1}', '{"a":2}'), '{"a":3}', 'numbers add');
select is(public.jsonb_add('{"a":1}', '{"b":2}'), '{"a":1,"b":2}', 'missing keys are added');
select is(public.jsonb_add('{"totals":{"pageviews":1,"sessions":1}}', '{"totals":{"pageviews":2}}'),
  '{"totals":{"pageviews":3,"sessions":1}}', 'objects recurse');
select is(public.jsonb_add('{"ctas":{"x":{"clicks":1,"kind":"internal"}}}', '{"ctas":{"x":{"clicks":1,"kind":"sms"}}}'),
  '{"ctas":{"x":{"clicks":2,"kind":"sms"}}}', 'strings overwrite');
select is(public.jsonb_add(null, '{"a":1}'), '{"a":1}', 'null a');
select is(public.jsonb_add('{"a":1}', null), '{"a":1}', 'null b');
select is(public.jsonb_add('{}', '{}'), '{}', 'empty inputs');

-- analytics_track: first batch starts the session.
select public.analytics_track('dev', '11111111-1111-1111-1111-111111111111',
  '[{"name":"pageview","path":"/","props":{"sessionStart":true},"ts":"2026-10-28T12:00:00Z","vid":"v1","sid":"11111111-1111-1111-1111-111111111111"}]',
  '{"vid":"v1","startedAt":"2026-10-28T12:00:00Z","source":"google","medium":"organic","campaign":null,"landing":"/","referrerHost":"google.com","device":"mobile","geo":"TX"}',
  '{"pageviews":1}', '{"start":true}', array['/', '/start'],
  '{"2026-10-28":{"totals":{"pageviews":1,"sessions":1}}}',
  '2027-01-26T12:00:00Z', '2027-11-27T12:00:00Z');

-- Second batch: only vid in set, a new path plus an already-seen one.
select public.analytics_track('dev', '11111111-1111-1111-1111-111111111111',
  '[]', '{"vid":"v1","primary":"strength"}', '{"pageviews":2,"engagedMs":500}',
  '{"quizStarted":true}', array['/pricing', '/'],
  '{"2026-10-28":{"totals":{"pageviews":2}}}',
  '2027-01-26T13:00:00Z', '2027-11-27T13:00:00Z');

select is((select started_at from analytics_sessions), '2026-10-28T12:00:00Z'::timestamptz, 'started_at kept');
select is((select source from analytics_sessions), 'google', 'source kept');
select is((select campaign from analytics_sessions), null, 'explicit null campaign stored');
select is((select "primary" from analytics_sessions), 'strength', 'primary set when present');
select is((select pageviews from analytics_sessions), 3, 'pageviews summed');
select is((select engaged_ms from analytics_sessions), 500::bigint, 'engaged_ms summed');
select is((select paths from analytics_sessions), array['/', '/start', '/pricing'], 'only new paths appended, in order');
select is((select reached from analytics_sessions), '{"start":true,"quizStarted":true}', 'reached merged');
select is((select expire_at from analytics_sessions), '2027-11-27T13:00:00Z'::timestamptz, 'session expiry refreshed');
select is((select data from analytics_daily where env = 'dev' and day = '2026-10-28'),
  '{"totals":{"pageviews":3,"sessions":1}}', 'daily summed');
select is((select count(*)::int from analytics_events), 1, 'one event inserted');
select is((select expire_at from analytics_events), '2027-01-26T12:00:00Z'::timestamptz, 'event expiry set');

-- analytics_record_lead
select public.analytics_record_lead('dev', null,
  '{"2026-10-28":{"totals":{"leads":1}}}', '{}', '{"lead":true}');
select is((select data -> 'totals' -> 'leads' from analytics_daily where env = 'dev'), '1', 'null sid still counts the lead');
select is((select lead_id from analytics_sessions), null, 'null sid leaves sessions alone');

select public.analytics_record_lead('dev', '11111111-1111-1111-1111-111111111111',
  '{"2026-10-28":{"totals":{"leads":1}}}', '{"leadId":"lead-1"}', '{"lead":true}');
select is((select lead_id from analytics_sessions), 'lead-1', 'lead_id set');
select is((select reached -> 'lead' from analytics_sessions), 'true', 'reached.lead set');
select is((select "primary" from analytics_sessions), 'strength', 'primary kept when absent');

select ok(not has_function_privilege('anon',
  'public.analytics_track(text,uuid,jsonb,jsonb,jsonb,jsonb,text[],jsonb,timestamptz,timestamptz)', 'execute'),
  'anon cannot call analytics_track');

select * from finish();
rollback;
