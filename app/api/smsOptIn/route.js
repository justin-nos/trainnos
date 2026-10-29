import {CONSENT_TEXT, validateOptIn} from "../../../lib/notify/optIn.mjs";
import {supabaseAdmin} from "../../../lib/supabase/admin";

// Records an opt-in to NOS Lead Alerts with the exact consent wording shown.
// An admin then adds the number to LEAD_ALERT_RECIPIENTS.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({error: "Invalid JSON"}, {status: 400});
  }
  // Honeypot: pretend success, store nothing.
  if (body?.website) return Response.json({success: true}, {status: 201});
  const check = validateOptIn(body);
  if (!check.ok) return Response.json({error: check.error}, {status: 400});

  const {error} = await supabaseAdmin()
    .from("sms_optins")
    .insert({
      ...check.optIn,
      consent_text: CONSENT_TEXT,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
  if (error) {
    console.error("Error saving SMS opt-in", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
  return Response.json({success: true}, {status: 201});
}
