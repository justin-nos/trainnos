// Turns stored daily docs into dashboard JSON.
import {QUESTIONS} from "../quiz/config.mjs";
import {FORM_STEPS} from "./config.mjs";
import {decodeKeys} from "./keys.mjs";

const TOTALS = [
  "pageviews",
  "sessions",
  "visitors",
  "leads",
  "clicks",
  "quizStarted",
  "quizCompleted",
];
const QUESTION_ORDER = QUESTIONS.map(q => q.id);

const rate = (n, d) => (d ? n / d : null);
const num = v => (typeof v === "number" && Number.isFinite(v) ? v : 0);

// Sums numeric leaves of `from` into `into`; strings (e.g. kind) are copied.
function merge(into, from) {
  for (const [k, v] of Object.entries(from ?? {})) {
    if (typeof v === "number") into[k] = num(into[k]) + num(v);
    else if (typeof v === "string") into[k] = v;
    else if (
      v &&
      typeof v === "object" &&
      Object.getPrototypeOf(v) === Object.prototype
    ) {
      merge((into[k] ??= {}), v);
    }
  }
  return into;
}

const byDesc = key => (a, b) => b[key] - a[key];

function dimension(map = {}) {
  return Object.entries(map)
    .map(([name, v]) => ({
      name,
      sessions: num(v.sessions),
      leads: num(v.leads),
      conversionRate: rate(num(v.leads), num(v.sessions)),
    }))
    .sort((a, b) => b.sessions - a.sessions || b.leads - a.leads);
}

// dailyDocs: stored docs (encoded keys, any order); days: day keys to cover.
export function summarize(dailyDocs, days) {
  const docs = new Map(
    dailyDocs.filter(Boolean).map(d => [d.date, decodeKeys(d)]),
  );
  const all = {};
  const series = days.map(date => {
    const doc = docs.get(date);
    if (doc) merge(all, doc);
    const t = doc?.totals ?? {};
    return {
      date,
      visitors: num(t.visitors),
      sessions: num(t.sessions),
      pageviews: num(t.pageviews),
      leads: num(t.leads),
    };
  });

  const t = Object.fromEntries(TOTALS.map(k => [k, num(all.totals?.[k])]));
  const pageMap = all.pages ?? {};
  const engagedMs = Object.values(pageMap).reduce(
    (s, p) => s + num(p.engagedMs),
    0,
  );

  const pages = Object.entries(pageMap)
    .map(([path, p]) => ({
      path,
      views: num(p.views),
      landings: num(p.landings),
      avgEngagedMs: rate(num(p.engagedMs), num(p.views)),
      reach75Rate: rate(num(p.s75), num(p.views)),
    }))
    .sort(byDesc("views"));

  const ctas = Object.entries(all.ctas ?? {})
    .map(([id, c]) => ({
      id,
      kind: c.kind ?? "internal",
      clicks: num(c.clicks),
      hovers: num(c.hovers),
      pages: Object.entries(c.pages ?? {})
        .map(([path, clicks]) => ({
          path,
          clicks: num(clicks),
          ctr: rate(num(clicks), num(pageMap[path]?.views)),
        }))
        .sort(byDesc("clicks")),
    }))
    .sort(byDesc("clicks"));

  // Sections further down are reached less, so views order them top-down.
  const sections = Object.fromEntries(
    Object.entries(all.sections ?? {}).map(([path, byId]) => [
      path,
      Object.entries(byId)
        .map(([id, s]) => ({
          id,
          views: num(s.views),
          reachRate: rate(num(s.views), num(pageMap[path]?.views)),
          avgMs: rate(num(s.ms), num(s.views)),
        }))
        .sort(byDesc("views")),
    ]),
  );

  const forms = Object.fromEntries(
    Object.entries(FORM_STEPS).map(([form, steps]) => [
      form,
      steps.map(step => ({step, count: num(all.forms?.[form]?.[step])})),
    ]),
  );

  const quiz = all.quiz ?? {};
  const order = id => {
    const i = QUESTION_ORDER.indexOf(id);
    return i === -1 ? Infinity : i;
  };
  const counts = (map = {}, key) =>
    Object.entries(map)
      .map(([k, count]) => ({[key]: k, count: num(count)}))
      .sort(byDesc("count"));

  return {
    hasData: t.pageviews > 0 || t.sessions > 0 || t.leads > 0,
    totals: {
      visitors: t.visitors,
      sessions: t.sessions,
      pageviews: t.pageviews,
      leads: t.leads,
      clicks: t.clicks,
      quizStarted: t.quizStarted,
      quizCompleted: t.quizCompleted,
      conversionRate: rate(t.leads, t.sessions),
      avgEngagedMs: rate(engagedMs, t.pageviews),
    },
    series,
    pages,
    sources: dimension(all.sources),
    mediums: dimension(all.mediums),
    campaigns: dimension(all.campaigns),
    devices: dimension(all.devices),
    geo: dimension(all.geo),
    ctas,
    sections,
    forms,
    quiz: {
      steps: Object.entries(quiz.steps ?? {})
        .map(([questionId, count]) => ({questionId, count: num(count)}))
        .sort((a, b) => order(a.questionId) - order(b.questionId)),
      answers: Object.fromEntries(
        Object.entries(quiz.answers ?? {}).map(([id, m]) => [
          id,
          counts(m, "value"),
        ]),
      ),
      results: counts(quiz.results, "program"),
    },
  };
}

// Relative change per headline metric; null when there's nothing to compare.
export function compare(current, previous) {
  return Object.fromEntries(
    Object.entries(current.totals).map(([k, cur]) => {
      const prev = previous?.totals?.[k];
      if (cur === null || prev === null || prev === undefined || prev === 0)
        return [k, null];
      return [k, (cur - prev) / prev];
    }),
  );
}
