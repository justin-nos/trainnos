// Display helpers shared by the analytics dashboard.
import {PROGRAMS, QUESTIONS} from "../../../lib/quiz/config.mjs";

const NUM = new Intl.NumberFormat("en-US");

export const fmtNum = n =>
  n === null || n === undefined ? "—" : NUM.format(n);

export function fmtPct(rate, digits = 0) {
  if (rate === null || rate === undefined) return "—";
  return `${(rate * 100).toFixed(rate > 0 && rate < 0.1 ? 1 : digits)}%`;
}

export function fmtDuration(ms) {
  if (ms === null || ms === undefined) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

// "2026-10-23" -> "Oct 23" (day keys are already Chicago dates).
export function fmtDay(day, opts = {}) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...opts,
  });
}

export const fmtRange = ({from, to}) =>
  from === to
    ? fmtDay(from, {year: "numeric"})
    : `${fmtDay(from)} – ${fmtDay(to, {year: "numeric"})}`;

export function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const programName = id => PROGRAMS[id]?.name ?? id;

const QUESTIONS_BY_ID = new Map(QUESTIONS.map(q => [q.id, q]));
export const questionPrompt = id => QUESTIONS_BY_ID.get(id)?.prompt ?? id;
export const answerLabel = (questionId, value) =>
  QUESTIONS_BY_ID.get(questionId)?.options?.find(o => o.value === value)
    ?.label ?? value;

// "Shown only when …" for conditional questions, derived from each question's
// showIf so it stays in sync with the quiz. Assumes visibility depends on "who".
const WHO = QUESTIONS_BY_ID.get("who");
export function shownWhen(questionId) {
  const q = QUESTIONS_BY_ID.get(questionId);
  if (!q?.showIf) return null;
  const shown = WHO.options.filter(o => q.showIf({who: o.value}));
  if (shown.length === WHO.options.length) return null;
  return `Shown only for: ${shown.map(o => o.label).join(", ")}`;
}

export const KIND_LABELS = {
  internal: "Internal",
  outbound: "Outbound",
  pushpress: "PushPress",
  sms: "SMS",
  tel: "Phone",
  mailto: "Email",
};

export const FORM_STEP_LABELS = {
  phone_typed: "Started typing a phone number",
  phone_valid: "Entered a valid number",
  consent_checked: "Checked the consent box",
  submit_attempt: "Tapped “Show me my fit”",
  phone_error: "Saw a phone number error",
  submit_error: "Saw a send error",
};

export const MILESTONE_LABELS = {
  pricing: "Pricing",
  start: "Quiz page",
  quizStarted: "Started quiz",
  quizCompleted: "Finished quiz",
  phoneTyped: "Typed phone",
  lead: "Lead",
  pushpress: "PushPress",
  sms: "SMS",
};
