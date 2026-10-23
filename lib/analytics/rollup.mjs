// Turns a sanitized batch into plain-number increment trees. The route converts
// numbers into FieldValue.increment; strings (e.g. a CTA's kind) are set as-is.
import {dayKey} from "./dates.mjs";
import {encodeKey} from "./keys.mjs";

// Only these are stored as raw docs; scroll, engagement, section and hover
// only update totals.
const RAW_EVENTS = new Set([
  "pageview",
  "click",
  "form",
  "quiz_started",
  "quiz_step",
  "quiz_completed",
]);

// Adds n at tree[...path], encoding every key after the first `plain` ones.
function bump(tree, path, n = 1, plain = 1) {
  let node = tree;
  const keys = path.map((k, i) => (i < plain ? k : encodeKey(k)));
  for (const k of keys.slice(0, -1)) node = node[k] ??= {};
  const last = keys.at(-1);
  node[last] = (node[last] ?? 0) + n;
}

const dayTree = (daily, ts) => (daily[dayKey(ts)] ??= {});

export function buildWrites(batch, {geo = null, device = "desktop"} = {}) {
  const {vid, sid, session: ctx} = batch;
  const events = [];
  const daily = {};
  const set = {vid};
  const inc = {};
  const reached = {};
  const paths = [];
  let started = false;

  for (const ev of batch.events) {
    const {name, path, props, ts} = ev;
    const day = dayTree(daily, ts);
    if (RAW_EVENTS.has(name)) events.push({name, path, props, ts, vid, sid});

    switch (name) {
      case "pageview":
        bump(day, ["totals", "pageviews"]);
        bump(day, ["pages", path, "views"]);
        inc.pageviews = (inc.pageviews ?? 0) + 1;
        if (!paths.includes(path)) paths.push(path);
        if (path === "/start") reached.start = true;
        if (path === "/pricing") reached.pricing = true;
        if (props.firstOfDay) bump(day, ["totals", "visitors"]);
        if (props.sessionStart && !started) {
          started = true;
          Object.assign(set, {
            startedAt: ts,
            source: ctx.source,
            medium: ctx.medium,
            campaign: ctx.campaign,
            landing: ctx.landing,
            referrerHost: ctx.referrerHost,
            device,
            geo,
          });
          bump(day, ["totals", "sessions"]);
          bump(day, ["pages", ctx.landing, "landings"]);
          bump(day, ["sources", ctx.source, "sessions"]);
          bump(day, ["mediums", ctx.medium, "sessions"]);
          if (ctx.campaign) bump(day, ["campaigns", ctx.campaign, "sessions"]);
          bump(day, ["devices", device, "sessions"]);
          if (geo) bump(day, ["geo", geo, "sessions"]);
        }
        break;
      case "click": {
        bump(day, ["totals", "clicks"]);
        bump(day, ["ctas", props.id, "clicks"]);
        bump(day, ["ctas", props.id, "pages", path]);
        // bump() already encoded the id, so set kind under the same key.
        day.ctas[encodeKey(props.id)].kind = props.kind;
        if (props.kind === "pushpress") reached.pushpress = true;
        if (props.kind === "sms") reached.sms = true;
        break;
      }
      case "scroll":
        bump(day, ["pages", path, `s${props.depth}`]);
        break;
      case "engagement":
        bump(day, ["pages", path, "engagedMs"], props.ms);
        inc.engagedMs = (inc.engagedMs ?? 0) + props.ms;
        break;
      case "section":
        if (props.seen) bump(day, ["sections", path, props.id, "views"]);
        if (props.ms) bump(day, ["sections", path, props.id, "ms"], props.ms);
        break;
      case "hover":
        bump(day, ["ctas", props.id, "hovers"]);
        day.ctas[encodeKey(props.id)].kind = props.kind;
        break;
      case "form":
        bump(day, ["forms", props.form, props.step]);
        if (props.form === "contact" && props.step === "phone_typed") {
          reached.phoneTyped = true;
        }
        break;
      case "quiz_started":
        bump(day, ["totals", "quizStarted"]);
        reached.quizStarted = true;
        break;
      case "quiz_step":
        bump(day, ["quiz", "steps", props.question_id], 1, 2);
        bump(day, ["quiz", "answers", props.question_id, props.value], 1, 2);
        break;
      case "quiz_completed":
        bump(day, ["totals", "quizCompleted"]);
        bump(day, ["quiz", "results", props.primary], 1, 2);
        reached.quizCompleted = true;
        set.primary = props.primary;
        break;
    }
  }

  return {events, session: {set, inc, reached, paths, started}, daily};
}

// Server-side lead counter, attributed to the visitor's session.
export function buildLeadWrites({session = {}, primary, leadId, now}) {
  const day = {};
  const source = session.source || "unknown";
  bump(day, ["totals", "leads"]);
  bump(day, ["sources", source, "leads"]);
  if (session.medium) bump(day, ["mediums", session.medium, "leads"]);
  if (session.campaign) bump(day, ["campaigns", session.campaign, "leads"]);
  const set = {};
  if (leadId) set.leadId = leadId;
  if (primary) set.primary = primary;
  return {
    daily: {[dayKey(now)]: day},
    session: {set, reached: {lead: true}},
  };
}
