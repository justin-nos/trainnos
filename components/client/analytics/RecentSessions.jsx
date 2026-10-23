"use client";
import {useCallback, useEffect, useState} from "react";
import {MILESTONE_LABELS, fmtDuration, fmtTime, programName} from "./format";

const MILESTONE_STYLES = {
  lead: "bg-red-50 text-red-700 ring-red-200",
  pushpress: "bg-green-50 text-green-700 ring-green-200",
  sms: "bg-green-50 text-green-700 ring-green-200",
};

// Latest visits, newest first, 25 at a time.
export default function RecentSessions() {
  const [sessions, setSessions] = useState([]);
  const [next, setNext] = useState(null);
  const [state, setState] = useState("loading");

  const load = useCallback(async before => {
    setState("loading");
    try {
      const params = new URLSearchParams({limit: "25"});
      if (before) params.set("before", before);
      const res = await fetch(`/api/analytics/sessions?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSessions(s => (before ? [...s, ...data.sessions] : data.sessions));
      setNext(data.next);
      setState("ready");
    } catch (error) {
      console.error("Could not load recent visits", error);
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "error" && !sessions.length) {
    return (
      <p className="py-6 text-center text-sm text-red-600">
        Couldn&rsquo;t load recent visits.{" "}
        <button
          type="button"
          onClick={() => load()}
          className="font-semibold underline"
        >
          Retry
        </button>
      </p>
    );
  }
  if (state === "loading" && !sessions.length) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">Loading visits…</p>
    );
  }
  if (!sessions.length) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">No visits yet.</p>
    );
  }

  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[48rem] text-sm">
          <caption className="sr-only">Recent visits</caption>
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th scope="col" className="py-2 font-semibold">
                Started
              </th>
              <th scope="col" className="py-2 pl-4 font-semibold">
                Source
              </th>
              <th scope="col" className="py-2 pl-4 font-semibold">
                Device · City
              </th>
              <th scope="col" className="py-2 pl-4 font-semibold">
                Pages
              </th>
              <th scope="col" className="py-2 pl-4 font-semibold">
                Engaged
              </th>
              <th scope="col" className="py-2 pl-4 font-semibold">
                Milestones
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => {
              const milestones = Object.keys(MILESTONE_LABELS).filter(
                k => s.reached[k],
              );
              return (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 align-top last:border-b-0"
                >
                  <td className="whitespace-nowrap py-2 text-gray-900">
                    {fmtTime(s.startedAt)}
                  </td>
                  <td className="py-2 pl-4">
                    <span className="font-medium text-gray-900">
                      {s.source ?? "—"}
                    </span>
                    {s.medium && s.medium !== "none" && (
                      <span className="text-gray-500"> / {s.medium}</span>
                    )}
                    {s.campaign && (
                      <span className="block text-xs text-gray-500">
                        {s.campaign}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pl-4 text-gray-600">
                    {s.device ?? "—"}
                    {s.geo && (
                      <span className="block text-xs text-gray-500">
                        {s.geo}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pl-4 text-gray-600">
                    <span className="text-gray-900">{s.pageviews}</span>
                    <span className="block text-xs text-gray-500">
                      {s.paths.join(" → ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-2 pl-4 tabular-nums text-gray-600">
                    {fmtDuration(s.engagedMs)}
                  </td>
                  <td className="py-2 pl-4">
                    <div className="flex flex-wrap gap-1">
                      {milestones.map(k => (
                        <span
                          key={k}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${MILESTONE_STYLES[k] ?? "bg-gray-50 text-gray-600 ring-gray-200"}`}
                        >
                          {k === "lead" && s.primary
                            ? `Lead · ${programName(s.primary)}`
                            : MILESTONE_LABELS[k]}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {next && (
        <button
          type="button"
          onClick={() => load(next)}
          disabled={state === "loading"}
          className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
        >
          {state === "loading" ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
