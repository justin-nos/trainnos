// Rule-based callouts for the dashboard home. Pure: summarize() output in,
// plain data and sentences out. Thresholds are in config.mjs.
import {INSIGHTS, TOTALS_FUNNEL} from "./config.mjs";

const rate = (n, d) => (d ? n / d : null);
const pct = r => `${Math.round(r * 100)}%`;
const num = n => n.toLocaleString("en-US");
const leadsWord = n => (n === 1 ? "lead" : "leads");

export const enoughData = current =>
  current.totals.sessions >= INSIGHTS.minSessions;

// The source whose lead count moved most in the direction of the net change,
// if it explains at least half of it.
export function leadDriver(sources, prevSources = []) {
  const cur = new Map(sources.map(s => [s.name, s.leads]));
  const prev = new Map(prevSources.map(s => [s.name, s.leads]));
  const total = m => [...m.values()].reduce((a, b) => a + b, 0);
  const net = total(cur) - total(prev);
  if (Math.abs(net) < INSIGHTS.minLeadChange) return null;
  let best = null;
  for (const name of new Set([...cur.keys(), ...prev.keys()])) {
    const change = (cur.get(name) ?? 0) - (prev.get(name) ?? 0);
    if (Math.sign(change) !== Math.sign(net)) continue;
    if (!best || Math.abs(change) > Math.abs(best.change)) {
      best = {name, change};
    }
  }
  return best && Math.abs(best.change) * 2 >= Math.abs(net) ? best : null;
}

export function headlineText({leads, prevLeads, days, driver}) {
  const period = `the previous ${days} days`;
  if (!leads && !prevLeads) return `No leads yet, and none in ${period}.`;
  if (!prevLeads) {
    return `${leads} ${leadsWord(leads)}, up from none in ${period}.`;
  }
  if (leads === prevLeads) {
    return `${leads} ${leadsWord(leads)}, the same as ${period}.`;
  }
  const dir = leads > prevLeads ? "up" : "down";
  const base = `${leads} ${leadsWord(leads)}, ${dir} from ${prevLeads} in ${period}`;
  if (!driver) return `${base}.`;
  return driver.change > 0
    ? `${base}, mostly from ${driver.name} (+${driver.change}).`
    : `${base}, mostly because ${driver.name} brought ${-driver.change} fewer.`;
}

const STEP_COUNTS = {
  sessions: c => c.totals.sessions,
  quizStarted: c => c.totals.quizStarted,
  quizCompleted: c => c.totals.quizCompleted,
  phoneTyped: c =>
    c.forms?.contact?.find(s => s.step === "phone_typed")?.count ?? 0,
  lead: c => c.totals.leads,
};

// Same shape as computeFunnel().steps so FunnelChart can draw it. Totals count
// events (a restarted quiz counts twice), so each step is capped at the one
// before to keep the funnel non-increasing.
export function totalsFunnel(current) {
  const steps = [];
  for (const def of TOTALS_FUNNEL) {
    const prev = steps.at(-1);
    const raw = STEP_COUNTS[def.key](current);
    const count = prev ? Math.min(raw, prev.count) : raw;
    steps.push({
      ...def,
      count,
      rateFromStart: rate(count, steps[0]?.count ?? count),
      rateFromPrev: prev ? rate(count, prev.count) : null,
    });
  }
  return steps;
}

// The worst step transition with enough people to be meaningful, or null.
// {from, to, lost} uses labels so FunnelChart can highlight it.
export function leak(steps) {
  let worst = null;
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1];
    if (prev.count < INSIGHTS.minStepCount) continue;
    const lost = 1 - steps[i].count / prev.count;
    if (lost > 0 && (!worst || lost > worst.lost)) {
      worst = {
        from: prev.label,
        to: steps[i].label,
        lost,
        text: `Of ${num(prev.count)} who ${prev.did}, ${pct(lost)} ${steps[i].missed}.`,
      };
    }
  }
  return worst;
}

// Sources that produced leads, most first, with the change vs. last period.
export function workingSources(sources, prevSources = [], limit = 5) {
  const prev = new Map(prevSources.map(s => [s.name, s.leads]));
  return sources
    .filter(s => s.leads > 0)
    .map(s => ({...s, change: s.leads - (prev.get(s.name) ?? 0)}))
    .sort(
      (a, b) =>
        b.leads - a.leads || (b.conversionRate ?? 0) - (a.conversionRate ?? 0),
    )
    .slice(0, limit);
}

// High-traffic sources converting far below the site rate. Empty when the site
// has no leads at all: the headline already says so.
export function watchSources(sources, siteRate, limit = 3) {
  if (!siteRate) return [];
  return sources
    .filter(
      s =>
        s.sessions >= INSIGHTS.watchMinSessions &&
        (s.conversionRate ?? 0) <= siteRate * INSIGHTS.watchRateRatio,
    )
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}

// {pushpress: 7, sms: 2, ...} summed over CTAs.
export function clicksByKind(ctas = []) {
  const out = {};
  for (const c of ctas) out[c.kind] = (out[c.kind] ?? 0) + c.clicks;
  return out;
}

// Relative change, matching compare() in summarize.mjs.
export const delta = (cur, prev) => (prev ? (cur - prev) / prev : null);
