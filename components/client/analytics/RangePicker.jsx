"use client";
import {useState} from "react";
import {fmtRange} from "./format";

export const PRESETS = [
  {key: "7d", label: "7 days", days: 7},
  {key: "30d", label: "30 days", days: 30},
  {key: "90d", label: "90 days", days: 90},
];

// range: {preset: "7d" | "30d" | "90d" | "custom", from, to}
export default function RangePicker({range, today, previousRange, onChange}) {
  const [draft, setDraft] = useState({from: range.from, to: range.to});
  const [custom, setCustom] = useState(range.preset === "custom");
  const draftValid = draft.from && draft.to && draft.from <= draft.to;

  const button = active =>
    `rounded-md px-3 py-1.5 text-sm font-semibold ${
      active
        ? "bg-indigo-600 text-white shadow-sm"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div
        role="group"
        aria-label="Date range"
        className="inline-flex flex-wrap gap-1 rounded-lg bg-white p-1 ring-1 ring-gray-200"
      >
        {PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            aria-pressed={range.preset === p.key}
            onClick={() => {
              setCustom(false);
              onChange({preset: p.key});
            }}
            className={button(range.preset === p.key && !custom)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => {
            setCustom(true);
            setDraft({from: range.from, to: range.to});
          }}
          className={button(custom)}
        >
          Custom
        </button>
      </div>
      {custom && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={e => {
            e.preventDefault();
            if (draftValid) onChange({preset: "custom", ...draft});
          }}
        >
          <label className="text-xs font-medium text-gray-600">
            From
            <input
              type="date"
              value={draft.from}
              max={draft.to || today}
              onChange={e => setDraft(d => ({...d, from: e.target.value}))}
              className="mt-1 block rounded-md border-0 px-2 py-1.5 text-sm text-gray-900 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label className="text-xs font-medium text-gray-600">
            To
            <input
              type="date"
              value={draft.to}
              min={draft.from}
              max={today}
              onChange={e => setDraft(d => ({...d, to: e.target.value}))}
              className="mt-1 block rounded-md border-0 px-2 py-1.5 text-sm text-gray-900 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <button
            type="submit"
            disabled={!draftValid}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40"
          >
            Apply
          </button>
        </form>
      )}
      <p className="text-xs text-gray-500">
        {fmtRange(range)}
        {previousRange && <> · vs. {fmtRange(previousRange)}</>}
      </p>
    </div>
  );
}
