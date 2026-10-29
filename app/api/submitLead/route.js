import {recommend, sanitizeAnswers} from "../../../lib/quiz/engine.mjs";
import {normalizeUSPhone} from "../../../lib/quiz/phone.mjs";
import {buildLeadWrites} from "../../../lib/analytics/rollup.mjs";
import {isUuid} from "../../../lib/analytics/schema.mjs";
import {recordLead} from "../../../lib/analytics/store";
import {leadToRow} from "../../../lib/db/rows.mjs";
import {supabaseAdmin} from "../../../lib/supabase/admin";

// Campaign attribution from the visitor's analytics session, never PII.
// `session` is the sid when that session exists, else null.
async function readAttribution(sid) {
  if (!isUuid(sid)) return {attribution: {source: "unknown"}, session: null};
  try {
    const {data, error} = await supabaseAdmin()
      .from("analytics_sessions")
      .select("source,medium,campaign,landing")
      .eq("id", sid)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return {attribution: {source: "unknown", sessionId: sid}, session: null};
    }
    const {source, medium, campaign, landing} = data;
    return {
      attribution: {
        source: source ?? "unknown",
        medium: medium ?? null,
        campaign: campaign ?? null,
        landing: landing ?? null,
        sessionId: sid,
      },
      session: sid,
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
    await recordLead({sid: session, writes});
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
    const {data, error} = await supabaseAdmin()
      .from("leads")
      .insert(
        leadToRow({
          firstName,
          phone,
          consent: true,
          answers: parsed.answers,
          recommendation: {primary: rec.primary, alternate: rec.alternate},
          status: "new",
          source: "fit-quiz",
          attribution,
        }),
      )
      .select("id")
      .single();
    if (error) throw error;
    lead = data;
  } catch (error) {
    console.error("Error writing lead", error);
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
