import {getAdminSession} from "../../../lib/admin/session";
import {
  dayRange,
  parseRange,
  previousRange,
} from "../../../lib/analytics/dates.mjs";
import {ENV} from "../../../lib/analytics/store";
import {dailyFromRow} from "../../../lib/db/rows.mjs";
import {supabaseAdmin} from "../../../lib/supabase/admin";
import {compare, summarize} from "../../../lib/analytics/summarize.mjs";

export const dynamic = "force-dynamic";

async function readDays(days) {
  const {data, error} = await supabaseAdmin()
    .from("analytics_daily")
    .select("day,data")
    .eq("env", ENV)
    .in("day", days);
  if (error) throw error;
  return data.map(dailyFromRow);
}

// Daily rollups for a range and the same-length range before it.
export async function GET(req) {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  const range = parseRange(new URL(req.url).searchParams);
  if (!range.ok) return Response.json({error: range.error}, {status: 400});

  const prev = previousRange(range.from, range.to);
  const days = dayRange(range.from, range.to);
  const prevDays = dayRange(prev.from, prev.to);
  try {
    const [docs, prevDocs] = await Promise.all([
      readDays(days),
      readDays(prevDays),
    ]);
    const current = summarize(docs, days);
    const previous = summarize(prevDocs, prevDays);
    return Response.json({
      range: {from: range.from, to: range.to},
      previousRange: prev,
      current,
      previous: {
        hasData: previous.hasData,
        totals: previous.totals,
        sources: previous.sources,
        ctas: previous.ctas,
      },
      deltas: compare(current, previous),
    });
  } catch (error) {
    console.error("Error reading analytics", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
}
