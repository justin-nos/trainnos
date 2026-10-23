import {Timestamp} from "firebase-admin/firestore";
import {getAdminSession} from "../../../auth";
import {initializeAdminApp} from "../../../../lib/initFirebaseAdmin";
import {col} from "../../../../lib/analytics/firestore";

const firestoreDB = initializeAdminApp();
export const dynamic = "force-dynamic";

const iso = ts => ts?.toDate().toISOString() ?? null;

// Most recent visits, newest first. Page with ?before=<startedAt of the last row>.
export async function GET(req) {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  const params = new URL(req.url).searchParams;
  const limit = Math.min(Math.max(Number(params.get("limit")) || 50, 1), 100);
  const before = Date.parse(params.get("before") ?? "");

  try {
    let query = firestoreDB
      .collection(col("sessions"))
      .orderBy("startedAt", "desc");
    if (Number.isFinite(before)) {
      query = query.where("startedAt", "<", Timestamp.fromMillis(before));
    }
    const snap = await query.limit(limit).get();
    const sessions = snap.docs.map(d => {
      const s = d.data();
      return {
        id: d.id,
        startedAt: iso(s.startedAt),
        lastSeenAt: iso(s.lastSeenAt),
        landing: s.landing ?? null,
        source: s.source ?? null,
        medium: s.medium ?? null,
        campaign: s.campaign ?? null,
        device: s.device ?? null,
        geo: s.geo ?? null,
        pageviews: s.pageviews ?? 0,
        engagedMs: s.engagedMs ?? 0,
        paths: s.paths ?? [],
        reached: s.reached ?? {},
        primary: s.primary ?? null,
      };
    });
    const next = sessions.length === limit ? sessions.at(-1).startedAt : null;
    return Response.json({sessions, next});
  } catch (error) {
    console.error("Error reading analytics sessions", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
}
