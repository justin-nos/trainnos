import {Timestamp} from "firebase-admin/firestore";
import {getAdminSession} from "../../../auth";
import {initializeAdminApp} from "../../../../lib/initFirebaseAdmin";
import {FUNNELS} from "../../../../lib/analytics/config.mjs";
import {
  addDays,
  dayStart,
  parseRange,
} from "../../../../lib/analytics/dates.mjs";
import {col} from "../../../../lib/analytics/firestore";
import {computeFunnel} from "../../../../lib/analytics/funnel.mjs";

const firestoreDB = initializeAdminApp();
export const dynamic = "force-dynamic";

const MAX_SESSIONS = 5000;

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
    const snap = await firestoreDB
      .collection(col("sessions"))
      .where("startedAt", ">=", Timestamp.fromMillis(dayStart(range.from)))
      .where(
        "startedAt",
        "<",
        Timestamp.fromMillis(dayStart(addDays(range.to, 1))),
      )
      .orderBy("startedAt", "desc")
      .limit(MAX_SESSIONS)
      .select("source", "device", "reached")
      .get();
    const sessions = snap.docs.map(d => d.data());
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
