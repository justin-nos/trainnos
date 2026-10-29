create extension if not exists pg_cron;
-- 09:00 UTC daily, same as the old Vercel cron. Covers both envs.
select cron.schedule('analytics-retention', '0 9 * * *', $$
  delete from public.analytics_events where expire_at < now();
  delete from public.analytics_sessions where expire_at < now();
$$);
