-- Photos and short videos for /community and the homepage strip. id is the
-- Storage folder id from /api/uploads/sign (community/<id>/...). The checks
-- mirror lib/community/schema.mjs.
create table public.community_posts (
  id uuid primary key,
  type text not null check (type in ('photo', 'video')),
  media_path text not null check (media_path like 'community/%'),
  content_type text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  duration real check (duration > 0 and duration <= 90),
  poster_path text check (poster_path like 'community/%'),
  caption text not null default '' check (char_length(caption) <= 200),
  status text not null default 'published' check (status in ('published', 'hidden')),
  pinned boolean not null default false,
  pinned_at timestamptz,
  uploaded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  check (type = 'photo' or (poster_path is not null and duration is not null))
);
-- Feed order: pinned first (newest pin first), then newest.
create index community_posts_feed_idx on public.community_posts
  (status, pinned desc, pinned_at desc nulls last, created_at desc);

alter table public.community_posts enable row level security;
