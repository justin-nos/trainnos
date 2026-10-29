// The NOS Lead Alerts SMS program (staff texts about new leads). The page,
// the API and the stored opt-in record all use this exact wording.
import {normalizeUSPhone} from "../quiz/phone.mjs";

export const BRAND = "No Off Season";
export const PROGRAM = "NOS Lead Alerts";
export const SUPPORT_EMAIL = "brannon@trainnos.com";
export const SUPPORT_PHONE = "(251) 895-4302";

export const CONSENT_TEXT =
  `I agree to receive recurring automated text messages from ${BRAND} (${PROGRAM}) ` +
  "at the mobile number above when a prospective client contacts the gym. " +
  "Message frequency varies (about 2 messages per new lead). Message and data rates may apply. " +
  "Reply STOP to opt out or HELP for help. Consent is not a condition of employment or purchase.";

export const NAME_MAX = 60;

// {ok: true, optIn: {name, phone}} | {ok: false, error}
export function validateOptIn(body) {
  if (!body || typeof body !== "object") return {ok: false, error: "Invalid request"};
  const name = String(body.name ?? "").trim();
  if (!name || name.length > NAME_MAX) return {ok: false, error: "Enter your name."};
  const phone = normalizeUSPhone(body.phone);
  if (!phone) return {ok: false, error: "Enter a valid US mobile number."};
  if (body.consent !== true) {
    return {ok: false, error: "Check the box to agree to receive text messages."};
  }
  return {ok: true, optIn: {name, phone}};
}
