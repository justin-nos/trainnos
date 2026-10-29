-- Coaches shown on /meet. Removing a trainer is a soft delete (active =
-- false, removed_at set) so they can be re-added from Past trainers. The
-- checks mirror lib/trainers/schema.mjs. 'Co-Founder' is fixed: it's set by
-- the seed script and the admin API never assigns or changes it.
create table public.trainers (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(name) between 1 and 60),
  position text not null
    check (position in ('Co-Founder', 'Head Coach', 'Strength & Conditioning Coach')),
  bio text not null default '' check (char_length(bio) <= 400),
  photo_path text not null,
  email text,
  phone text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  removed_at timestamptz
);
create index trainers_active_order_idx on public.trainers (active, sort_order);

alter table public.trainers enable row level security;
