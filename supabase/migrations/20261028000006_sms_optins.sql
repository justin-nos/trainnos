-- Opt-ins for the NOS Lead Alerts SMS program (/sms-alerts). Kept as proof
-- of consent: the exact wording shown, and when. Only the server writes here.
create table public.sms_optins (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 60),
  phone text not null,
  consent_text text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index sms_optins_phone_idx on public.sms_optins (phone);

alter table public.sms_optins enable row level security;
