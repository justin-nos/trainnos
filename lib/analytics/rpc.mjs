// Turns rollup.mjs writes into arguments for the analytics_* Postgres
// functions (supabase/migrations/*_analytics_functions.sql).
import {RAW_RETENTION_DAYS, SESSION_RETENTION_DAYS} from "./config.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;
const iso = ms => new Date(ms).toISOString();

// Previews and local dev write env = 'dev' rows so production stays clean.
export const ENV_FOR = vercelEnv => (vercelEnv === "production" ? "prod" : "dev");

const nonEmpty = obj => (Object.keys(obj).length ? obj : null);

export function trackParams({env, sid, writes, now}) {
  const {set, inc, reached, paths} = writes.session;
  // Only keys buildWrites set are sent; the function overwrites just those.
  const p_set = {...set};
  if ("startedAt" in set) p_set.startedAt = iso(set.startedAt);
  return {
    p_env: env,
    p_sid: sid,
    p_events: writes.events.map(ev => ({...ev, ts: iso(ev.ts)})),
    p_set,
    p_inc: inc,
    p_reached: nonEmpty(reached),
    p_paths: paths.length ? paths : null,
    p_daily: writes.daily,
    p_event_expire: iso(now + RAW_RETENTION_DAYS * DAY_MS),
    p_session_expire: iso(now + SESSION_RETENTION_DAYS * DAY_MS),
  };
}

// sid is null when the lead has no known analytics session.
export function leadParams({env, sid, writes}) {
  return {
    p_env: env,
    p_sid: sid ?? null,
    p_daily: writes.daily,
    p_set: writes.session.set,
    p_reached: nonEmpty(writes.session.reached),
  };
}
