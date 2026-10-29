import {getAdminSession} from "../../../../lib/admin/session";
import {FUNNELS} from "../../../../lib/analytics/config.mjs";
import {
  addDays,
  dayStart,
  parseRange,
} from "../../../../lib/analytics/dates.mjs";
import {ENV} from "../../../../lib/analytics/store";
import {computeFunnel} from "../../../../lib/analytics/funnel.mjs";
import {supabaseAdmin} from "../../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_SESSIONS = 5000;
// PostgREST returns at most 1,000 rows per request.
const PAGE = 1000;
const iso = ms => new Date(ms).toISOString();

async function readSessions(from, to) {
  const sessions = [];
  while (sessions.length < MAX_SESSIONS) {
    const start = sessions.length;
    const end = Math.min(start + PAGE, MAX_SESSIONS) - 1;
    const {data, error} = await supabaseAdmin()
      .from("analytics_sessions")
      .select("source,device,reached")
      .eq("env", ENV)
      .gte("started_at", iso(dayStart(from)))
      .lt("started_at", iso(dayStart(addDays(to, 1))))
      .order("started_at", {ascending: false})
      .range(start, end);
    if (error) throw error;
    sessions.push(...data);
    if (data.length < end - start + 1) break;
  }
  return sessions;
}

const countBy = (sessions, key) => {
  const counts = new Map();
  for (const s of sessions) {
    if (s[key]) counts.set(s[key], (counts.get(s[key]) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).map(([name]) => name);
};

// Session-based funnel for sessions that started in the range.
export async function GET(req) {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  const params = new URL(req.url).searchParams;
  const range = parseRange(params);
  if (!range.ok) return Response.json({error: range.error}, {status: 400});
  const funnelKey = params.get("funnel") ?? "quiz";
  if (!Object.hasOwn(FUNNELS, funnelKey)) {
    return Response.json({error: "Unknown funnel"}, {status: 400});
  }

  try {
    const sessions = await readSessions(range.from, range.to);
    return Response.json({
      funnel: computeFunnel(sessions, funnelKey, {
        source: params.get("source") || undefined,
        device: params.get("device") || undefined,
      }),
      sources: countBy(sessions, "source"),
      devices: countBy(sessions, "device"),
      sessionsRead: sessions.length,
      truncated: sessions.length === MAX_SESSIONS,
    });
  } catch (error) {
    console.error("Error reading analytics sessions", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
}
