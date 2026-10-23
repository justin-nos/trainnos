import {Timestamp} from "firebase-admin/firestore";
import {initializeAdminApp} from "../../../../lib/initFirebaseAdmin";

const firestoreDB = initializeAdminApp();
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Firestore TTL needs billing, so expired docs are deleted here instead, once a
// day by Vercel Cron (vercel.json). Cron only runs on production, so this also
// cleans the dev collections that previews and local dev write to.
const COLLECTIONS = [
  "analytics_events",
  "analytics_sessions",
  "analytics_dev_events",
  "analytics_dev_sessions",
];
const PAGE = 500;
// Stays well inside the free tier's 20k deletes/day; leftovers go tomorrow.
const MAX_DELETES = 15000;
const TIME_BUDGET_MS = 45 * 1000;

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }

  const started = Date.now();
  const now = Timestamp.now();
  const deleted = {};
  let total = 0;
  try {
    for (const name of COLLECTIONS) {
      deleted[name] = 0;
      while (total < MAX_DELETES && Date.now() - started < TIME_BUDGET_MS) {
        const snap = await firestoreDB
          .collection(name)
          .where("expireAt", "<", now)
          .limit(Math.min(PAGE, MAX_DELETES - total))
          .select()
          .get();
        if (snap.empty) break;
        const batch = firestoreDB.batch();
        for (const doc of snap.docs) batch.delete(doc.ref);
        await batch.commit();
        deleted[name] += snap.size;
        total += snap.size;
        if (snap.size < PAGE) break;
      }
    }
  } catch (error) {
    console.error("Error cleaning up analytics", error);
    return Response.json({error: "Server Error", deleted}, {status: 500});
  }
  return Response.json({deleted, total});
}
