"use client";
import {fmtPct} from "./format";

// Change vs. the previous period. For every headline number, up is good.
export function DeltaPill({delta}) {
  if (delta === null || delta === undefined) {
    return (
      <span
        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500"
        title="No data in the previous period"
      >
        —
      </span>
    );
  }
  const up = delta > 0;
  const flat = Math.abs(delta) < 0.005;
  const style = flat
    ? "bg-gray-100 text-gray-600"
    : up
      ? "bg-green-50 text-green-700"
      : "bg-red-50 text-red-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>
      <span aria-hidden="true">{flat ? "" : up ? "▲ " : "▼ "}</span>
      <span className="sr-only">
        {flat ? "No change" : up ? "Up" : "Down"}
      </span>{" "}
      {fmtPct(Math.abs(delta))}
    </span>
  );
}

export default function StatCard({label, value, delta, hint}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <DeltaPill delta={delta} />
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
    </div>
  );
}
