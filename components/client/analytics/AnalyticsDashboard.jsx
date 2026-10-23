"use client";
import {useCallback, useEffect, useRef, useState} from "react";
import {FaRotateRight} from "react-icons/fa6";
import {addDays, dayKey, isDayKey} from "../../../lib/analytics/dates.mjs";
import CtasTab from "./CtasTab";
import FunnelsTab from "./FunnelsTab";
import OverviewTab from "./OverviewTab";
import PagesTab from "./PagesTab";
import RangePicker, {PRESETS} from "./RangePicker";

const TABS = [
  {key: "overview", label: "Overview", Component: OverviewTab},
  {key: "pages", label: "Pages & Sources", Component: PagesTab},
  {key: "funnels", label: "Funnels", Component: FunnelsTab},
  {key: "ctas", label: "CTAs", Component: CtasTab},
];
const DEFAULT = {preset: "30d", tab: "overview"};

function resolveRange({preset, from, to}, today) {
  const p = PRESETS.find(x => x.key === preset);
  if (p) return {preset, from: addDays(today, -(p.days - 1)), to: today};
  return {preset: "custom", from, to};
}

// "#30d/funnels" or "#2026-10-01_2026-10-20/ctas", so views can be shared.
function parseHash(hash) {
  const [rangePart, tabPart] = hash.replace(/^#/, "").split("/");
  const tab = TABS.some(t => t.key === tabPart) ? tabPart : DEFAULT.tab;
  if (PRESETS.some(p => p.key === rangePart)) return {preset: rangePart, tab};
  const [from, to] = (rangePart ?? "").split("_");
  if (isDayKey(from) && isDayKey(to) && from <= to) {
    return {preset: "custom", from, to, tab};
  }
  return {...DEFAULT, tab};
}

const toHash = (range, tab) =>
  `#${range.preset === "custom" ? `${range.from}_${range.to}` : range.preset}/${tab}`;

export default function AnalyticsDashboard() {
  const [today] = useState(() => dayKey(Date.now()));
  const [view, setView] = useState(null); // {range, tab} once the hash is read
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  const tabRefs = useRef([]);

  useEffect(() => {
    const read = () => {
      const {tab, ...range} = parseHash(location.hash);
      setView({range: resolveRange(range, today), tab});
    };
    read();
    addEventListener("hashchange", read);
    return () => removeEventListener("hashchange", read);
  }, [today]);

  const update = next => {
    const merged = {...view, ...next};
    history.replaceState(null, "", toHash(merged.range, merged.tab));
    setView(merged);
  };

  const from = view?.range.from;
  const to = view?.range.to;
  const load = useCallback(async () => {
    if (!from) return;
    setState("loading");
    try {
      const res = await fetch(`/api/analytics?from=${from}&to=${to}`, {
        cache: "no-store",
      });
      if (res.status === 401) return setState("unauthorized");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setState("ready");
    } catch (error) {
      console.error("Could not load analytics", error);
      setState("error");
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  if (!view) return null;
  const active = TABS.find(t => t.key === view.tab) ?? TABS[0];
  const fresh = data && data.range.from === from && data.range.to === to;
  const empty = fresh && !data.current.hasData && active.key !== "funnels";

  const onTabKey = (e, i) => {
    const step = {ArrowRight: 1, ArrowLeft: -1}[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (i + step + TABS.length) % TABS.length;
    update({tab: TABS[next].key});
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div
          role="tablist"
          aria-label="Analytics views"
          className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          {TABS.map((t, i) => (
            <button
              key={t.key}
              ref={el => (tabRefs.current[i] = el)}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={t.key === active.key}
              aria-controls="analytics-panel"
              tabIndex={t.key === active.key ? 0 : -1}
              onClick={() => update({tab: t.key})}
              onKeyDown={e => onTabKey(e, i)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${
                t.key === active.key
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-start gap-2">
          <RangePicker
            key={`${view.range.from}_${view.range.to}`}
            range={view.range}
            today={today}
            previousRange={fresh ? data.previousRange : null}
            onChange={r => update({range: resolveRange(r, today)})}
          />
          <button
            type="button"
            onClick={load}
            disabled={state === "loading"}
            aria-label="Refresh"
            className="rounded-lg p-2.5 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <FaRotateRight
              aria-hidden="true"
              className={`size-3 ${state === "loading" ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div
        id="analytics-panel"
        role="tabpanel"
        aria-labelledby={`tab-${active.key}`}
      >
        {state === "unauthorized" && (
          <Message>
            Sign in with your @trainnos.com Google account to see analytics.
          </Message>
        )}
        {state === "error" && (
          <Message tone="error">
            Couldn&rsquo;t load analytics.{" "}
            <button
              type="button"
              onClick={load}
              className="font-semibold underline"
            >
              Retry
            </button>
          </Message>
        )}
        {state === "loading" && !data && <Message>Loading analytics…</Message>}
        {empty && state !== "error" && (
          <Message>
            No data yet for this range. Visits show up here a few seconds after
            they happen.
          </Message>
        )}
        {data && !empty && state !== "error" && state !== "unauthorized" && (
          <div
            className={
              state === "loading" ? "opacity-60 transition-opacity" : ""
            }
          >
            <active.Component data={data} range={view.range} />
          </div>
        )}
      </div>
    </div>
  );
}

function Message({children, tone}) {
  return (
    <p
      className={`rounded-xl bg-white px-4 py-10 text-center text-sm shadow-sm ring-1 ring-gray-200 ${
        tone === "error" ? "text-red-600" : "text-gray-500"
      }`}
    >
      {children}
    </p>
  );
}
