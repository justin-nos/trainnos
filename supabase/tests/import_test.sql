begin;
select plan(17);

-- Post-deploy traffic for a session that started before the cutover.
select public.analytics_track('prod', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '[]', '{"vid":"v-new"}', '{"pageviews":1}', '{"pricing":true}', array['/pricing'],
  '{"2026-10-28":{"totals":{"pageviews":1}}}',
  '2027-01-26T00:00:00Z', '2027-11-27T00:00:00Z');

select is(public.import_firestore($${
  "leads": [{"id": "fsLeadId0000000000001", "first_name": "Sam", "phone": "+15555550100",
    "consent": true, "answers": {"goal": "strength"}, "recommendation": {"primary": "strength"},
    "status": "contacted", "source": "quiz", "attribution": {"source": "google"},
    "created_at": "2026-10-25T15:00:00Z", "updated_at": "2026-10-26T15:00:00Z"}],
  "testimonials": [{"id": "t1", "first_name": "Ana", "last_name": "B", "title": "Member",
    "text": "Great", "image_path": "testimonialImages/t1.png"}],
  "email_signups": [{"email": "a@example.com", "name": "A"}],
  "events": [
    {"name": "pageview", "path": "/", "props": {}, "ts": "2026-10-28T10:00:00Z",
     "vid": "v-old", "sid": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "expire_at": "2027-01-26T10:00:00Z"},
    {"name": "pageview", "path": "/start", "props": {}, "ts": "2026-10-28T10:01:00Z",
     "vid": "v-old", "sid": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "expire_at": "2027-01-26T10:01:00Z"}],
  "sessions": [
    {"id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "vid": "v-old",
     "started_at": "2026-10-28T10:00:00Z", "last_seen_at": "2026-10-28T10:01:00Z",
     "source": "google", "medium": "organic", "landing": "/", "device": "mobile",
     "pageviews": 2, "engaged_ms": 1000, "paths": ["/", "/start"], "reached": {"start": true},
     "expire_at": "2027-11-27T10:00:00Z"},
    {"id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "vid": "v2",
     "started_at": "2026-10-27T10:00:00Z", "last_seen_at": "2026-10-27T10:05:00Z",
     "source": "direct", "pageviews": 1, "paths": ["/"], "reached": {},
     "lead_id": "fsLeadId0000000000001", "expire_at": "2027-11-26T10:00:00Z"}],
  "daily": {
    "2026-10-27": {"totals": {"pageviews": 5, "sessions": 2}},
    "2026-10-28": {"totals": {"pageviews": 2, "sessions": 1}}}
}$$::jsonb),
  '{"leads":1,"testimonials":1,"email_signups":1,"events":2,"sessions":2,"daily":2}',
  'returns row counts');

select is((select status from leads where id = 'fsLeadId0000000000001'), 'contacted', 'lead keeps its id and status');
select is((select created_at from leads), '2026-10-25T15:00:00Z'::timestamptz, 'lead keeps created_at');
select is((select image_path from testimonials), 'testimonialImages/t1.png', 'testimonial image path');
select is((select count(*)::int from analytics_events where env = 'prod'), 2, 'events imported as prod');

-- The straddling session merges.
select is((select vid from analytics_sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'v-new', 'post-deploy value wins');
select is((select source from analytics_sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'google', 'Firestore fills gaps');
select is((select started_at from analytics_sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  '2026-10-28T10:00:00Z'::timestamptz, 'started_at from Firestore');
select is((select pageviews from analytics_sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 3, 'pageviews summed');
select is((select paths from analytics_sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  array['/', '/start', '/pricing'], 'Firestore paths first');
select is((select reached from analytics_sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  '{"start":true,"pricing":true}', 'reached merged');
select is((select expire_at from analytics_sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  '2027-11-27T10:00:00Z'::timestamptz, 'later expiry wins');
select is((select lead_id from analytics_sessions where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'fsLeadId0000000000001', 'new session inserted with lead_id');

-- Daily rollups add onto post-deploy increments.
select is((select data from analytics_daily where env = 'prod' and day = '2026-10-28'),
  '{"totals":{"pageviews":3,"sessions":1}}', 'cutover day summed');
select is((select data from analytics_daily where env = 'prod' and day = '2026-10-27'),
  '{"totals":{"pageviews":5,"sessions":2}}', 'pre-cutover day imported');

select throws_ok($$select public.import_firestore('{}')$$, 'Firestore import already ran', 'second run refused');
select ok(not has_function_privilege('anon', 'public.import_firestore(jsonb)', 'execute'),
  'anon cannot call import_firestore');

select * from finish();
rollback;
