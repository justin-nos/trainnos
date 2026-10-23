import {FieldValue} from "firebase-admin/firestore";
import {initializeAdminApp} from "../../../lib/initFirebaseAdmin";
import {recommend, sanitizeAnswers} from "../../../lib/quiz/engine.mjs";
import {normalizeUSPhone} from "../../../lib/quiz/phone.mjs";
import {addDailyWrites, col} from "../../../lib/analytics/firestore";
import {buildLeadWrites} from "../../../lib/analytics/rollup.mjs";
import {isUuid} from "../../../lib/analytics/schema.mjs";

const firestoreDB = initializeAdminApp();

// Campaign attribution from the visitor's analytics session, never PII.
async function readAttribution(sid) {
  if (!isUuid(sid)) return {attribution: {source: "unknown"}, session: null};
  try {
    const snap = await firestoreDB.collection(col("sessions")).doc(sid).get();
    if (!snap.exists) {
      return {attribution: {source: "unknown", sessionId: sid}, session: null};
    }
    const {source, medium, campaign, landing} = snap.data();
    return {
      attribution: {
        source: source ?? "unknown",
        medium: medium ?? null,
        campaign: campaign ?? null,
        landing: landing ?? null,
        sessionId: sid,
      },
      session: snap.ref,
    };
  } catch (error) {
    console.error("Error reading analytics session", error);
    return {attribution: {source: "unknown"}, session: null};
  }
}

// Counts the lead in analytics. Failures are logged and never fail the lead.
async function countLead({attribution, session, leadId, primary}) {
  try {
    const writes = buildLeadWrites({
      session: attribution,
      primary,
      leadId,
      now: Date.now(),
    });
    const batch = firestoreDB.batch();
    addDailyWrites(firestoreDB, batch, writes.daily);
    if (session) {
      batch.set(
        session,
        {...writes.session.set, reached: writes.session.reached},
        {merge: true},
      );
    }
    await batch.commit();
  } catch (error) {
    console.error("Error counting lead in analytics", error);
  }
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({error: "Invalid JSON"}, {status: 400});
  }
  if (!body || typeof body !== "object") {
    return Response.json({error: "Invalid body"}, {status: 400});
  }

  // Honeypot: pretend success, store nothing.
  if (body.website) return Response.json({success: true}, {status: 200});

  const firstName = String(body.firstName ?? "").trim();
  const phone = normalizeUSPhone(body.phone);
  if (!firstName || firstName.length > 50) {
    return Response.json({error: "Name is required"}, {status: 400});
  }
  if (!phone) {
    return Response.json(
      {error: "Enter a valid US phone number"},
      {status: 400},
    );
  }
  if (body.consent !== true) {
    return Response.json({error: "Consent is required"}, {status: 400});
  }
  const parsed = sanitizeAnswers({...body.answers, firstName});
  if (!parsed.ok) return Response.json({error: parsed.error}, {status: 400});

  // Recomputed here so a tampered request can't store a made-up recommendation.
  const rec = recommend(parsed.answers);
  const {attribution, session} = await readAttribution(body.analytics?.sid);
  let lead;
  try {
    lead = await firestoreDB.collection("leads").add({
      firstName,
      phone,
      consent: true,
      answers: parsed.answers,
      recommendation: {primary: rec.primary, alternate: rec.alternate},
      status: "new",
      source: "fit-quiz",
      attribution,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error writing lead to Firestore", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
  await countLead({
    attribution,
    session,
    leadId: lead.id,
    primary: rec.primary,
  });
  return Response.json({success: true}, {status: 201});
}
