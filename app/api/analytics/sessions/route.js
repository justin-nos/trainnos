import {getAdminSession} from "../../../../lib/admin/session";
import {ENV} from "../../../../lib/analytics/store";
import {sessionFromRow} from "../../../../lib/db/rows.mjs";
import {supabaseAdmin} from "../../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

// Most recent visits, newest first. Page with ?before=<startedAt of the last row>.
export async function GET(req) {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  const params = new URL(req.url).searchParams;
  const limit = Math.min(Math.max(Number(params.get("limit")) || 50, 1), 100);
  const before = Date.parse(params.get("before") ?? "");

  try {
    let query = supabaseAdmin()
      .from("analytics_sessions")
      .select("*")
      .eq("env", ENV)
      .not("started_at", "is", null)
      .order("started_at", {ascending: false});
    if (Number.isFinite(before)) {
      query = query.lt("started_at", new Date(before).toISOString());
    }
    const {data, error} = await query.limit(limit);
    if (error) throw error;
    const sessions = data.map(sessionFromRow);
    const next = sessions.length === limit ? sessions.at(-1).startedAt : null;
    return Response.json({sessions, next});
  } catch (error) {
    console.error("Error reading analytics sessions", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
}
