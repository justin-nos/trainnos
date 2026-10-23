// Validation for /api/track batches. Anything not in the allowlist is dropped.
import {PROGRAMS, QUESTIONS} from "../quiz/config.mjs";
import {
  CLICK_KINDS,
  FORM_STEPS,
  MAX_EVENTS_PER_BATCH,
  SECTION_ID,
} from "./config.mjs";
import {clampTs} from "./dates.mjs";
import {normalizePath} from "./keys.mjs";
import {sanitizeHref} from "./source.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = value => typeof value === "string" && UUID.test(value);

const SITE_HOSTS = new Set([
  "trainnos.com",
  "www.trainnos.com",
  "localhost",
  "127.0.0.1",
]);
const PRIVATE_IPV4 = /^(10\.\d+|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+$/;

// Browsers send Origin on beacons and fetches; requests without one are allowed.
export function isAllowedOrigin(origin) {
  if (!origin) return true;
  let host;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  return (
    SITE_HOSTS.has(host) ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".local") ||
    PRIVATE_IPV4.test(host)
  );
}

const isPlainObject = v => !!v && typeof v === "object" && !Array.isArray(v);
const str = (value, max) => {
  if (typeof value !== "string") return null;
  const s = value.trim().slice(0, max);
  return s || null;
};

// Only choice questions; free-text answers (the name) are never tracked.
const CHOICE_QUESTIONS = new Map(
  QUESTIONS.filter(q => q.type !== "text").map(q => [
    q.id,
    new Set(q.options.map(o => o.value)),
  ]),
);
const PROGRAM_IDS = new Set(Object.keys(PROGRAMS));

// Visible time since the last report: whole ms, at most 30 minutes.
function durationMs(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const ms = Math.round(value);
  return ms >= 0 && ms <= 1_800_000 ? ms : null;
}

const PROPS = {
  pageview(p) {
    const props = {};
    if (p.sessionStart === true) props.sessionStart = true;
    if (p.firstOfDay === true) props.firstOfDay = true;
    return props;
  },
  click(p) {
    const id = str(p.id, 60);
    if (!id || !CLICK_KINDS.includes(p.kind)) return null;
    const props = {id, kind: p.kind};
    const href = sanitizeHref(p.href);
    if (href) props.href = href;
    return props;
  },
  scroll(p) {
    return [25, 50, 75, 100].includes(p.depth) ? {depth: p.depth} : null;
  },
  engagement(p) {
    const ms = durationMs(p.ms);
    return ms === null ? null : {ms};
  },
  section(p) {
    const ms = durationMs(p.ms);
    if (typeof p.id !== "string" || !SECTION_ID.test(p.id) || ms === null) {
      return null;
    }
    const props = {id: p.id, ms};
    if (p.seen === true) props.seen = true;
    return props;
  },
  hover(p) {
    const id = str(p.id, 60);
    if (!id || !CLICK_KINDS.includes(p.kind)) return null;
    return {id, kind: p.kind};
  },
  form(p) {
    if (!FORM_STEPS[p.form]?.includes(p.step)) return null;
    return {form: p.form, step: p.step};
  },
  quiz_started() {
    return {};
  },
  quiz_step(p) {
    const values = CHOICE_QUESTIONS.get(p.question_id);
    if (!values || !values.has(p.value)) return null;
    return {question_id: p.question_id, value: p.value};
  },
  quiz_completed(p) {
    if (!PROGRAM_IDS.has(p.primary)) return null;
    const props = {primary: p.primary};
    if (PROGRAM_IDS.has(p.alternate)) props.alternate = p.alternate;
    if (CHOICE_QUESTIONS.get("who").has(p.who)) props.who = p.who;
    return props;
  },
};

function sanitizeSession(raw) {
  const s = isPlainObject(raw) ? raw : {};
  const lower = (v, max) => str(v, max)?.toLowerCase() ?? null;
  return {
    source: lower(s.source, 40) ?? "direct",
    medium: lower(s.medium, 40) ?? "none",
    campaign: lower(s.campaign, 40),
    landing: normalizePath(s.landing) ?? "other",
    referrerHost: lower(s.referrerHost, 100),
  };
}

export function sanitizeBatch(body, {now = Date.now()} = {}) {
  if (!isPlainObject(body)) return {ok: false, error: "Body must be an object"};
  if (body.v !== 1) return {ok: false, error: "Unsupported version"};
  if (!isUuid(body.vid) || !isUuid(body.sid)) {
    return {ok: false, error: "Invalid ids"};
  }
  if (!Array.isArray(body.events)) return {ok: false, error: "Missing events"};
  if (body.events.length > MAX_EVENTS_PER_BATCH) {
    return {ok: false, error: "Too many events"};
  }

  const events = [];
  for (const ev of body.events) {
    if (!isPlainObject(ev) || !Object.hasOwn(PROPS, ev.name)) continue;
    const path = normalizePath(ev.path);
    if (!path) continue;
    const props = PROPS[ev.name](isPlainObject(ev.props) ? ev.props : {});
    if (!props) continue;
    events.push({name: ev.name, ts: clampTs(ev.ts, now), path, props});
  }

  return {
    ok: true,
    batch: {
      vid: body.vid.toLowerCase(),
      sid: body.sid.toLowerCase(),
      session: sanitizeSession(body.session),
      events,
    },
  };
}
