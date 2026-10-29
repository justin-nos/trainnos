// Server-only analytics writes, one Postgres function call per write path.
import {supabaseAdmin} from "../supabase/admin";
import {ENV_FOR, leadParams, trackParams} from "./rpc.mjs";

export const ENV = ENV_FOR(process.env.VERCEL_ENV);

async function call(fn, params) {
  const {error} = await supabaseAdmin().rpc(fn, params);
  if (error) throw error;
}

export const recordTrack = ({sid, writes, now}) =>
  call("analytics_track", trackParams({env: ENV, sid, writes, now}));

export const recordLead = ({sid, writes}) =>
  call("analytics_record_lead", leadParams({env: ENV, sid, writes}));
