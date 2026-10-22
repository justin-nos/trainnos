import {FieldValue} from "firebase-admin/firestore";
import {initializeAdminApp} from "../../../lib/initFirebaseAdmin";
import {recommend, sanitizeAnswers} from "../../../lib/quiz/engine.mjs";
import {normalizeUSPhone} from "../../../lib/quiz/phone.mjs";

const firestoreDB = initializeAdminApp();

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
  try {
    await firestoreDB.collection("leads").add({
      firstName,
      phone,
      consent: true,
      answers: parsed.answers,
      recommendation: {primary: rec.primary, alternate: rec.alternate},
      status: "new",
      source: "fit-quiz",
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error writing lead to Firestore", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
  return Response.json({success: true}, {status: 201});
}
