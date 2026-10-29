"use client";
import {useEffect, useRef, useState} from "react";
import {useSearchParams} from "next/navigation";
import {FaMessage, FaPhone, FaRotateRight} from "react-icons/fa6";
import {PROGRAMS} from "../../lib/quiz/config.mjs";
import {selectedOption} from "../../lib/quiz/engine.mjs";
import {formatUSPhone} from "../../lib/quiz/phone.mjs";

const STATUSES = [
  {
    value: "new",
    label: "New",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
  {
    value: "contacted",
    label: "Contacted",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  {
    value: "booked",
    label: "Booked",
    className: "bg-green-50 text-green-700 ring-green-200",
  },
  {
    value: "not-a-fit",
    label: "Not a fit",
    className: "bg-gray-100 text-gray-600 ring-gray-200",
  },
];
// Answers worth seeing at a glance, in this order.
const HIGHLIGHTS = [
  "who",
  "goal",
  "athleteGoal",
  "sport",
  "days",
  "time",
  "budget",
];
const COLUMNS =
  "sm:grid sm:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,2fr)_9rem] sm:items-center sm:gap-4";

function timeAgo(iso) {
  if (!iso) return "—";
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function LeadsTable() {
  const [leads, setLeads] = useState([]);
  const [state, setState] = useState("loading");
  const [rowError, setRowError] = useState(null);
  // ?lead=<id> (from a lead alert text) scrolls to that row and flashes it once.
  const focusId = useSearchParams().get("lead");
  const focused = useRef(false);
  const [highlight, setHighlight] = useState(null);

  const load = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/leads", {cache: "no-store"});
      if (res.status === 401) return setState("unauthorized");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data.leads);
      setState("ready");
    } catch (error) {
      console.error("Could not load leads", error);
      setState("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!focusId || state !== "ready" || focused.current) return;
    const row = document.getElementById(`lead-${focusId}`);
    if (!row) return;
    focused.current = true;
    row.scrollIntoView({block: "center"});
    setHighlight(focusId);
    const id = setTimeout(() => setHighlight(null), 3000);
    return () => clearTimeout(id);
  }, [focusId, state]);

  // Update on screen right away; put the old status back if the save fails.
  const changeStatus = async (id, status) => {
    const previous = leads.find(l => l.id === id)?.status;
    setRowError(null);
    setLeads(ls => ls.map(l => (l.id === id ? {...l, status} : l)));
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({status}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.error("Could not update lead status", error);
      setLeads(ls => ls.map(l => (l.id === id ? {...l, status: previous} : l)));
      setRowError(id);
    }
  };

  const newCount = leads.filter(l => l.status === "new").length;

  return (
    <section aria-labelledby="leads-heading" className="mb-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2
            id="leads-heading"
            className="text-xl font-bold tracking-tight text-gray-900"
          >
            Leads
          </h2>
          {newCount > 0 && (
            <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-semibold text-white">
              {newCount} new
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={state === "loading"}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          <FaRotateRight
            aria-hidden="true"
            className={`size-3 ${state === "loading" ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {state === "loading" && leads.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            Loading leads…
          </p>
        )}
        {state === "unauthorized" && (
          <p className="px-4 py-10 text-center text-sm text-gray-600">
            Sign in with your @trainnos.com Google account to see leads.
          </p>
        )}
        {state === "error" && (
          <p className="px-4 py-10 text-center text-sm text-red-600">
            Couldn&rsquo;t load leads. Try Refresh.
          </p>
        )}
        {state === "ready" && leads.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            No leads yet. They&rsquo;ll show up here when someone finishes the
            Find Your Fit quiz.
          </p>
        )}
        {leads.length > 0 && (
          <div role="table" aria-label="Leads" className="text-sm">
            <div
              role="row"
              className={`hidden border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 ${COLUMNS}`}
            >
              <span role="columnheader">Date</span>
              <span role="columnheader">Name</span>
              <span role="columnheader">Phone</span>
              <span role="columnheader">Program</span>
              <span role="columnheader">Highlights</span>
              <span role="columnheader">Status</span>
            </div>
            {leads.map(lead => (
              <LeadRow
                key={lead.id}
                lead={lead}
                failed={rowError === lead.id}
                highlighted={highlight === lead.id}
                onStatus={status => changeStatus(lead.id, status)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LeadRow({lead, failed, highlighted, onStatus}) {
  const answers = lead.answers ?? {};
  const primary = PROGRAMS[lead.recommendation?.primary];
  const alternate = PROGRAMS[lead.recommendation?.alternate];
  const status = STATUSES.find(s => s.value === lead.status) ?? STATUSES[0];
  const highlights = HIGHLIGHTS.map(id => selectedOption(answers, id)).filter(
    Boolean,
  );

  return (
    <div
      id={`lead-${lead.id}`}
      role="row"
      className={`space-y-3 border-b border-gray-100 px-4 py-4 transition-shadow last:border-b-0 sm:space-y-0 ${COLUMNS} ${
        highlighted ? "ring-2 ring-inset ring-red-500" : ""
      }`}
    >
      <div role="cell" className="flex items-baseline justify-between sm:block">
        <span className="font-semibold text-gray-900 sm:hidden">
          {lead.firstName}
        </span>
        <span>
          <time
            dateTime={lead.createdAt ?? undefined}
            title={
              lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ""
            }
            className="text-gray-500"
          >
            {timeAgo(lead.createdAt)}
          </time>
          {lead.attribution?.source && (
            <span className="ml-2 text-xs text-gray-400 sm:ml-0 sm:block">
              via {lead.attribution.source}
            </span>
          )}
        </span>
      </div>
      <div
        role="cell"
        className="hidden truncate font-semibold text-gray-900 sm:block"
      >
        {lead.firstName}
      </div>
      <div role="cell" className="flex items-center gap-2">
        <span className="whitespace-nowrap text-gray-900">
          {lead.phone ? formatUSPhone(lead.phone) : "—"}
        </span>
        {lead.phone && (
          <>
            <a
              href={`tel:${lead.phone}`}
              aria-label={`Call ${lead.firstName}`}
              className="rounded-full p-2 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900"
            >
              <FaPhone aria-hidden="true" className="size-3" />
            </a>
            <a
              href={`sms:${lead.phone}`}
              aria-label={`Text ${lead.firstName}`}
              className="rounded-full p-2 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900"
            >
              <FaMessage aria-hidden="true" className="size-3" />
            </a>
          </>
        )}
      </div>
      <div role="cell">
        <span className="font-medium text-gray-900">
          {primary?.name ?? "—"}
        </span>
        {alternate && (
          <span className="block text-xs text-gray-500">
            or {alternate.name}
          </span>
        )}
      </div>
      <div role="cell" className="flex flex-wrap gap-1.5">
        {answers.injuries === "yes" && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            Injury
          </span>
        )}
        {highlights.map(option => (
          <span
            key={`${option.icon}-${option.wrapped}`}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
          >
            {option.wrapped}
          </span>
        ))}
      </div>
      <div role="cell">
        <label htmlFor={`status-${lead.id}`} className="sr-only">
          Status for {lead.firstName}
        </label>
        <select
          id={`status-${lead.id}`}
          value={status.value}
          onChange={e => onStatus(e.target.value)}
          className={`w-full rounded-lg px-2 py-1.5 text-sm font-semibold ring-1 ${status.className}`}
        >
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {failed && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            Couldn&rsquo;t save. Try again.
          </p>
        )}
      </div>
    </div>
  );
}
