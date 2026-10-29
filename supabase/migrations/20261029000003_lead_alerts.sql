-- SMS alerts to the coaches about new leads (lib/notify/leadAlerts.js).
-- alert_scheduled holds the Twilio SIDs still pending, so a status change or
-- a DONE reply can cancel them.
alter table public.leads
  add column alert_code text,
  add column alert_scheduled text[] not null default '{}',
  add column alert_sent_at timestamptz,
  add column alert_failed integer not null default 0,
  add column contacted_by text;
-- Codes are 3 chars, so they're only unique among recent New leads.
create index leads_alert_code_idx on public.leads (alert_code) where alert_code is not null;
