begin;
select plan(9);

select ok((select relrowsecurity from pg_class where oid = 'public.community_posts'::regclass),
  'RLS is enabled on community_posts');

insert into public.community_posts (id, type, media_path, content_type, width, height, created_at)
values ('11111111-1111-1111-1111-111111111111', 'photo',
  'community/11111111-1111-1111-1111-111111111111/original.jpg', 'image/jpeg', 1200, 1600,
  '2026-10-29T10:00:00Z');
select is((select status from public.community_posts
  where id = '11111111-1111-1111-1111-111111111111'), 'published', 'status defaults to published');
select is((select caption from public.community_posts
  where id = '11111111-1111-1111-1111-111111111111'), '', 'caption defaults to empty');

select throws_ok($$insert into public.community_posts (id, type, media_path, content_type, width, height)
  values (gen_random_uuid(), 'video', 'community/x/original.mp4', 'video/mp4', 1080, 1920)$$,
  '23514', null, 'video without poster or duration rejected');
select throws_ok($$insert into public.community_posts
  (id, type, media_path, content_type, width, height, duration, poster_path)
  values (gen_random_uuid(), 'video', 'community/x/original.mp4', 'video/mp4', 1080, 1920, 91,
    'community/x/poster.jpg')$$,
  '23514', null, '91-second video rejected');
select throws_ok($$insert into public.community_posts (id, type, media_path, content_type, width, height)
  values (gen_random_uuid(), 'photo', 'trainers/x/original.jpg', 'image/jpeg', 10, 10)$$,
  '23514', null, 'path outside community/ rejected');
select throws_ok($$insert into public.community_posts
  (id, type, media_path, content_type, width, height, caption)
  values (gen_random_uuid(), 'photo', 'community/x/original.jpg', 'image/jpeg', 10, 10,
    repeat('a', 201))$$,
  '23514', null, '201-character caption rejected');

-- Two more posts: an older pinned one and a newer pinned-earlier one.
select lives_ok($$insert into public.community_posts
  (id, type, media_path, content_type, width, height, duration, poster_path, pinned, pinned_at, created_at)
values
  ('22222222-2222-2222-2222-222222222222', 'video',
   'community/22222222-2222-2222-2222-222222222222/original.mp4', 'video/mp4', 1080, 1920, 42,
   'community/22222222-2222-2222-2222-222222222222/poster.jpg', true, '2026-10-29T12:00:00Z',
   '2026-10-20T10:00:00Z'),
  ('33333333-3333-3333-3333-333333333333', 'photo',
   'community/33333333-3333-3333-3333-333333333333/original.jpg', 'image/jpeg', 10, 10, null, null,
   true, '2026-10-29T11:00:00Z', '2026-10-28T10:00:00Z')$$,
  'video with poster and duration accepted');

select is(
  (select array_agg(id::text order by pinned desc, pinned_at desc nulls last, created_at desc, id)
   from public.community_posts
   where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
     '33333333-3333-3333-3333-333333333333')),
  array['22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111'],
  'feed order: newest pin first, then newest');

select * from finish();
rollback;
