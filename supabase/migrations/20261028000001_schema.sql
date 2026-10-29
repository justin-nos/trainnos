-- All access is server-side with the secret key (bypasses RLS). RLS is on
-- with no policies so the publishable key can read nothing.
create table public.leads (
  id text primary key default gen_random_uuid()::text,
  first_name text not null,
  phone text not null,
  consent boolean not null,
  answers jsonb not null,
  recommendation jsonb not null,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'booked', 'not-a-fit')),
  source text not null,
  attribution jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status);

-- env is 'prod' or 'dev' (replaces the analytics_ vs analytics_dev_ prefix).
create table public.analytics_daily (
  env text not null check (env in ('prod', 'dev')),
  day date not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (env, day)
);

-- started_at is null for a row first created by a non-start batch.
create table public.analytics_sessions (
  id uuid primary key,
  env text not null check (env in ('prod', 'dev')),
  vid text,
  started_at timestamptz,
  last_seen_at timestamptz not null default now(),
  source text, medium text, campaign text, landing text,
  referrer_host text, device text, geo text,
  pageviews integer not null default 0,
  engaged_ms bigint not null default 0,
  paths text[] not null default '{}',
  reached jsonb not null default '{}',
  "primary" text,
  lead_id text,
  expire_at timestamptz not null
);
create index analytics_sessions_started_idx
  on public.analytics_sessions (env, started_at desc);
create index analytics_sessions_expire_idx on public.analytics_sessions (expire_at);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  env text not null check (env in ('prod', 'dev')),
  name text not null,
  path text,
  props jsonb not null default '{}',
  ts timestamptz not null,
  vid text,
  sid uuid,
  created_at timestamptz not null default now(),
  expire_at timestamptz not null
);
create index analytics_events_expire_idx on public.analytics_events (expire_at);

create table public.testimonials (
  id text primary key,
  first_name text, last_name text, title text, text text,
  image_path text,
  created_at timestamptz not null default now()
);

create table public.email_signups (
  email text primary key,
  name text,
  created_at timestamptz not null default now()
);

create table public.testimonial_links (
  token text primary key,
  created_at timestamptz not null default now()
);

create table public.import_runs (
  name text primary key,
  ran_at timestamptz not null default now(),
  summary jsonb
);

alter table public.leads enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.testimonials enable row level security;
alter table public.email_signups enable row level security;
alter table public.testimonial_links enable row level security;
alter table public.import_runs enable row level security;

-- Public reads by URL; writes only via the secret key (signed uploads).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 200 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']);
