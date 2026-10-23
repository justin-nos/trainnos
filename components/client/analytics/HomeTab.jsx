"use client";
import {useEffect, useState} from "react";
import {INSIGHTS} from "../../../lib/analytics/config.mjs";
import {dayRange} from "../../../lib/analytics/dates.mjs";
import {
  clicksByKind,
  delta,
  enoughData,
  headlineText,
  leadDriver,
  leak,
  totalsFunnel,
  watchSources,
  workingSources,
} from "../../../lib/analytics/insights.mjs";
import Card from "./Card";
import FunnelChart from "./FunnelChart";
import LineChart from "./LineChart";
import Sparkline from "./Sparkline";
import {DeltaPill} from "./StatCard";
import {fmtNum, fmtPct} from "./format";
import {toHash} from "./hash";

const LINK = "font-semibold text-indigo-600 hover:text-indigo-500";
const leadsWord = n => (n === 1 ? "lead" : "leads");

// The weekly check-in: did the site bring leads, where from, and what's the
// one thing to fix. Everything else is a link into the other tabs.
export default function HomeTab({data, range, onRange}) {
  const {current, deltas} = data;
  const previous = {sources: [], ctas: [], ...data.previous};
  const t = current.totals;
  const days = dayRange(range.from, range.to).length;
  const href = (tab, params) => toHash(range, tab, params);

  const headline = headlineText({
    leads: t.leads,
    prevLeads: previous.totals?.leads ?? 0,
    days,
    driver: leadDriver(current.sources, previous.sources),
  });
  const steps = totalsFunnel(current);
  const theLeak = leak(steps);
  const working = workingSources(current.sources, previous.sources);
  const watch = watchSources(current.sources, t.conversionRate);
  const kinds = clicksByKind(current.ctas);
  const prevKinds = clicksByKind(previous.ctas);
  const textsAndCalls = k => (k.sms ?? 0) + (k.tel ?? 0);

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="verdict-label"
        className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2
              id="verdict-label"
              className="text-sm font-medium text-gray-500"
            >
              Leads
            </h2>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-5xl font-bold tracking-tight text-gray-900">
                {fmtNum(t.leads)}
              </p>
              <DeltaPill delta={deltas.leads} />
            </div>
            <p className="mt-2 text-base text-gray-700">{headline}</p>
            <NewLeadsLink />
          </div>
          <Sparkline
            values={current.series.map(d => d.leads)}
            className="h-10 w-full flex-none sm:w-64"
          />
        </div>
      </section>

      {enoughData(current) ? (
        <>
          <Card
            title={
              theLeak ? (
                <span className="text-amber-800">{theLeak.text}</span>
              ) : (
                "No clear drop-off this period"
              )
            }
            description="Find Your Fit, approximate: counts quiz events from daily totals."
            action={
              <a
                href={href("funnels")}
                className={`whitespace-nowrap text-sm ${LINK}`}
              >
                Exact funnel →
              </a>
            }
          >
            <FunnelChart steps={steps} drop={theLeak} showNote={false} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              title="Where leads came from"
              description="Sources ranked by leads, with the change from last period and their conversion rate."
            >
              {working.length ? (
                <ul className="divide-y divide-gray-100 text-sm">
                  {working.map(s => (
                    <li
                      key={s.name}
                      className="flex items-baseline justify-between gap-3 py-2"
                    >
                      <a
                        href={href("funnels", {source: s.name})}
                        className="min-w-0 truncate font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {s.name}
                      </a>
                      <span className="flex flex-none items-baseline gap-3 tabular-nums">
                        <span className="font-semibold text-gray-900">
                          {fmtNum(s.leads)} {leadsWord(s.leads)}
                        </span>
                        <Change n={s.change} />
                        <span className="w-12 text-right text-xs text-gray-500">
                          {fmtPct(s.conversionRate, 1)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-gray-500">
                  No leads this period.
                </p>
              )}
            </Card>
            <Card
              title="Traffic that isn't converting"
              description={`At least ${INSIGHTS.watchMinSessions} visits, converting at a quarter of the site rate or less.`}
            >
              {watch.length ? (
                <ul className="divide-y divide-gray-100 text-sm">
                  {watch.map(s => (
                    <li
                      key={s.name}
                      className="flex items-baseline justify-between gap-3 py-2"
                    >
                      <a
                        href={href("pages", {source: s.name})}
                        className="min-w-0 truncate font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {s.name}
                      </a>
                      <span className="flex-none text-gray-600 tabular-nums">
                        {fmtNum(s.sessions)} visits ·{" "}
                        <span className="font-semibold text-gray-900">
                          {fmtPct(s.conversionRate, 1)}
                        </span>{" "}
                        vs {fmtPct(t.conversionRate, 1)} site
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-gray-500">
                  Nothing stands out. Every busy source is converting.
                </p>
              )}
            </Card>
          </div>
        </>
      ) : (
        <TooFew sessions={t.sessions} range={range} onRange={onRange} />
      )}

      <Card>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ContextStat
            label="Visitors"
            value={fmtNum(t.visitors)}
            delta={deltas.visitors}
          />
          <ContextStat
            label="Lead conversion"
            value={fmtPct(t.conversionRate, 1)}
            delta={deltas.conversionRate}
          />
          <ContextStat
            label="PushPress clicks"
            value={fmtNum(kinds.pushpress ?? 0)}
            delta={delta(kinds.pushpress ?? 0, prevKinds.pushpress ?? 0)}
          />
          <ContextStat
            label="Texts & calls"
            value={fmtNum(textsAndCalls(kinds))}
            delta={delta(textsAndCalls(kinds), textsAndCalls(prevKinds))}
          />
        </dl>
      </Card>
      <Card title="Daily visitors and leads">
        <LineChart series={current.series} />
      </Card>
    </div>
  );
}

// "3 new leads waiting". An extra: renders nothing on zero or on failure.
function NewLeadsLink() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/leads/new-count", {cache: "no-store"})
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled && data) setCount(data.count);
      })
      .catch(error => console.error("Could not count new leads", error));
    return () => {
      cancelled = true;
    };
  }, []);
  if (!count) return null;
  return (
    <a href="/admins/leads" className={`mt-3 inline-block text-sm ${LINK}`}>
      {fmtNum(count)} new {leadsWord(count)} waiting →
    </a>
  );
}

function TooFew({sessions, range, onRange}) {
  // The next longer preset; nothing past 90 days.
  const next = {"7d": "30d", "30d": "90d", custom: "30d"}[range.preset];
  return (
    <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-600 shadow-sm ring-1 ring-gray-200">
      Only {fmtNum(sessions)} {sessions === 1 ? "visit" : "visits"} in this
      range, too few to call out trends.
      {next && (
        <>
          {" "}
          <button
            type="button"
            onClick={() => onRange({preset: next})}
            className={LINK}
          >
            Switch to {next === "30d" ? "30" : "90"} days
          </button>
        </>
      )}
    </p>
  );
}

function Change({n}) {
  if (!n) return null;
  return (
    <span
      className={`text-xs font-semibold ${n > 0 ? "text-green-700" : "text-red-700"}`}
    >
      {n > 0 ? `+${n}` : `−${-n}`}
      <span className="sr-only"> vs. previous period</span>
    </span>
  );
}

function ContextStat({label, value, delta}) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 flex items-center gap-2">
        <span className="text-lg font-semibold tabular-nums text-gray-900">
          {value}
        </span>
        <DeltaPill delta={delta} />
      </dd>
    </div>
  );
}
