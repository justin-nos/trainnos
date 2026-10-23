import {getAdminSession} from "../../auth";
import {initializeAdminApp} from "../../../lib/initFirebaseAdmin";
import {
  dayRange,
  parseRange,
  previousRange,
} from "../../../lib/analytics/dates.mjs";
import {col} from "../../../lib/analytics/firestore";
import {compare, summarize} from "../../../lib/analytics/summarize.mjs";

const firestoreDB = initializeAdminApp();
export const dynamic = "force-dynamic";

async function readDays(days) {
  const refs = days.map(day => firestoreDB.collection(col("daily")).doc(day));
  const snaps = await firestoreDB.getAll(...refs);
  return snaps.filter(s => s.exists).map(s => s.data());
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
      previous: {hasData: previous.hasData, totals: previous.totals},
      deltas: compare(current, previous),
    });
  } catch (error) {
    console.error("Error reading analytics from Firestore", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
}
