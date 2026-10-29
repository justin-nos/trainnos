// Text messages about new leads, sent to the coaches.
import {PROGRAMS} from "../quiz/config.mjs";
import {recommend, selectedOption} from "../quiz/engine.mjs";
import {formatUSPhone} from "../quiz/phone.mjs";
import {shortCentralTime} from "./schedule.mjs";

// No 0/O or 1/I, so a code read off a lock screen can't be mistyped.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE = /^[A-Z2-9]{3}$/;

// Plain ASCII (no emoji or curly quotes) keeps messages GSM-7: 160 chars per
// segment, not 70.
export function toAscii(text) {
  return String(text)
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\n]/g, "");
}

const label = (answers, id) => selectedOption(answers, id)?.label;
const join = parts => parts.filter(Boolean).join(" | ");
const isAthlete = answers => answers.who === "teen" || answers.who === "kid";

function whoLine(lead) {
  const answers = lead.answers ?? {};
  if (isAthlete(answers)) {
    const kind = answers.who === "teen" ? "a teen athlete" : "a young athlete";
    return `${lead.firstName} (parent of ${kind}${answers.sport ? `, ${label(answers, "sport")}` : ""})`;
  }
  if (answers.who === "friends") return `${lead.firstName} (+ ${label(answers, "who").replace(/^Me \+ /, "")})`;
  return lead.firstName;
}

// 3-character code for "DONE K7P" replies, derived from the lead id (FNV-1a).
export function makeAlertCode(id) {
  let hash = 0x811c9dc5;
  for (const char of String(id)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  let code = "";
  for (let i = 0; i < 3; i++) {
    code += CODE_ALPHABET[hash % CODE_ALPHABET.length];
    hash = Math.floor(hash / CODE_ALPHABET.length);
  }
  return code;
}

// lead: {id, firstName, phone, answers, recommendation, createdAt}
export function leadAlertText(lead, {siteUrl, reminder = false}) {
  const answers = lead.answers ?? {};
  const primary = lead.recommendation?.primary ?? recommend(answers).primary;
  const days = label(answers, "days");
  const lines = [
    reminder
      ? `Reminder: ${lead.firstName} is still New (came in ${shortCentralTime(new Date(lead.createdAt))}).`
      : `New NOS lead: ${whoLine(lead)}`,
    `${isAthlete(answers) ? "Their goal" : "Wants"}: ${join([
      label(answers, isAthlete(answers) ? "athleteGoal" : "goal"),
      label(answers, "experience"),
    ]) || "-"}`,
    `Best fit: ${join([PROGRAMS[primary]?.name, days && `${days} days/wk`, label(answers, "time")])}`,
    answers.injuries === "yes" && "! Mentioned an injury",
    `Call: ${formatUSPhone(lead.phone)}`,
    `${siteUrl}/admins/leads?lead=${encodeURIComponent(lead.id)}`,
    `Reply DONE ${makeAlertCode(lead.id)} once you've reached out.`,
  ];
  return toAscii(lines.filter(Boolean).join("\n"));
}

// "done" | "Done!" | "DONE k7p" → {done: true, code: "K7P" | null}; else {done: false}
export function parseInbound(body) {
  const words = String(body ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(" ");
  if (words[0] !== "DONE") return {done: false};
  return {done: true, code: CODE.test(words[1] ?? "") ? words[1] : null};
}

// Reply when a bare DONE matches several New leads.
export function whichLeadText(leads) {
  return toAscii(
    `Which one? ${leads.map(l => `DONE ${l.code} (${l.firstName})`).join(", ")}`,
  );
}
