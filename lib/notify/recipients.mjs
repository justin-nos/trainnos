import {normalizeUSPhone} from "../quiz/phone.mjs";

// LEAD_ALERT_RECIPIENTS="Brannon:+12518954302,Gavin:+12516566025" →
// {recipients: [{name, phone}], invalid: [entries that didn't parse]}
export function parseRecipients(value) {
  const recipients = [];
  const invalid = [];
  for (const entry of String(value ?? "").split(",")) {
    if (!entry.trim()) continue;
    const at = entry.indexOf(":");
    const name = at === -1 ? "" : entry.slice(0, at).trim();
    const phone = at === -1 ? null : normalizeUSPhone(entry.slice(at + 1).trim());
    if (name && phone) recipients.push({name, phone});
    else invalid.push(entry.trim());
  }
  return {recipients, invalid};
}
