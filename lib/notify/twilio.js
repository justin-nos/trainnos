import {randomUUID} from "node:crypto";
import twilio from "twilio";
import {parseRecipients} from "./recipients.mjs";

// TWILIO_DRY_RUN=1 logs messages instead of sending them (local dev, and
// production until the A2P 10DLC campaign is verified).
const dryRun = () => process.env.TWILIO_DRY_RUN === "1";

let client;
const getClient = () =>
  (client ??= twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN));

// The coaches who get lead texts, from LEAD_ALERT_RECIPIENTS.
export function recipients() {
  const {recipients, invalid} = parseRecipients(process.env.LEAD_ALERT_RECIPIENTS);
  if (invalid.length) console.error("Skipping invalid LEAD_ALERT_RECIPIENTS entries", invalid);
  return recipients;
}

// Sends now, or schedules for sendAt (15 min to 35 days out). Returns the SID.
export async function sendSms({to, body, sendAt}) {
  if (dryRun()) {
    const sid = `dry-${randomUUID().slice(0, 8)}`;
    console.log(
      `[sms dry-run] ${sid} to ${to} ${sendAt ? `scheduled for ${sendAt.toISOString()}` : "now"}\n${body}`,
    );
    return sid;
  }
  const message = await getClient().messages.create({
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    to,
    body,
    ...(sendAt && {scheduleType: "fixed", sendAt: sendAt.toISOString()}),
  });
  return message.sid;
}

// Cancels a scheduled message. A message that already went out (or was
// already canceled) can't be canceled, which is fine here.
export async function cancelSms(sid) {
  if (sid.startsWith("dry-")) {
    if (dryRun()) console.log(`[sms dry-run] canceled ${sid}`);
    return;
  }
  try {
    await getClient().messages(sid).update({status: "canceled"});
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      console.warn(`Couldn't cancel ${sid} (already sent or gone)`, error.message);
      return;
    }
    throw error;
  }
}

// Inbound webhooks are signed against the public URL, not req.url (Vercel
// rewrites the host), so validate against SITE_URL.
export function isValidTwilioRequest(signature, params) {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN ?? "",
    signature ?? "",
    `${process.env.SITE_URL}/api/twilio/inbound`,
    params,
  );
}

export const MessagingResponse = twilio.twiml.MessagingResponse;
