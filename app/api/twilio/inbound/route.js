import {cancelLeadAlerts} from "../../../../lib/notify/leadAlerts";
import {makeAlertCode, parseInbound, toAscii, whichLeadText} from "../../../../lib/notify/leadMessage.mjs";
import {MessagingResponse, isValidTwilioRequest, recipients, sendSms} from "../../../../lib/notify/twilio";
import {supabaseAdmin} from "../../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

const RECENT_MS = 7 * 24 * 60 * 60 * 1000;

function reply(text) {
  const twiml = new MessagingResponse();
  if (text) twiml.message(toAscii(text));
  return new Response(twiml.toString(), {headers: {"Content-Type": "text/xml"}});
}

// New leads a DONE reply could mean: the code's lead, or every New lead that
// was alerted in the last week.
async function findLeads(code) {
  let query = supabaseAdmin()
    .from("leads")
    .select("id, first_name")
    .eq("status", "new")
    .order("created_at", {ascending: false});
  query = code
    ? query.eq("alert_code", code).limit(1)
    : query.gte("alert_sent_at", new Date(Date.now() - RECENT_MS).toISOString());
  const {data, error} = await query;
  if (error) throw error;
  return data;
}

// Twilio's webhook for texts to the alert number. A coach replies
// "DONE" or "DONE K7P" to mark a lead Contacted.
export async function POST(req) {
  const params = Object.fromEntries(
    [...(await req.formData()).entries()].map(([k, v]) => [k, String(v)]),
  );
  if (!isValidTwilioRequest(req.headers.get("x-twilio-signature"), params)) {
    return new Response("Forbidden", {status: 403});
  }

  const coaches = recipients();
  const sender = coaches.find(c => c.phone === params.From);
  // STOP/HELP are handled by Twilio; strangers get no reply.
  if (!sender) return reply(null);

  const {done, code} = parseInbound(params.Body);
  if (!done) return reply("Reply DONE <code> to mark a lead contacted.");

  try {
    const leads = await findLeads(code);
    if (!leads.length) {
      return reply(code ? `No New lead with code ${code}.` : "No new leads waiting.");
    }
    if (leads.length > 1) {
      return reply(
        whichLeadText(leads.map(l => ({code: makeAlertCode(l.id), firstName: l.first_name}))),
      );
    }

    const [lead] = leads;
    const {data, error} = await supabaseAdmin()
      .from("leads")
      .update({
        status: "contacted",
        updated_at: new Date().toISOString(),
        contacted_by: sender.name,
      })
      .eq("id", lead.id)
      .eq("status", "new")
      .select("id");
    if (error) throw error;
    if (!data.length) return reply(`${lead.first_name} was already updated.`);

    await cancelLeadAlerts(lead.id).catch(err =>
      console.error("Error cancelling lead alerts after DONE", err),
    );
    const others = coaches.filter(c => c.phone !== sender.phone);
    await Promise.allSettled(
      others.map(c =>
        sendSms({
          to: c.phone,
          body: toAscii(`${sender.name} is on it: ${lead.first_name} marked Contacted.`),
        }),
      ),
    );
    return reply(`Got it. ${lead.first_name} marked Contacted, reminders cancelled.`);
  } catch (error) {
    console.error("Error handling DONE reply", error);
    return reply("Something went wrong. Mark the lead on the website instead.");
  }
}
