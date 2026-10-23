"use client";
import {biggestDrop} from "../../../lib/analytics/funnel.mjs";
import {fmtNum, fmtPct} from "./format";

// Horizontal steps; bar width is the share of sessions that started the funnel.
export default function FunnelChart({steps}) {
  const drop = biggestDrop(steps);
  return (
    <div>
      <ol className="space-y-3">
        {steps.map((step, i) => {
          const isDrop = drop && step.label === drop.to;
          return (
            <li key={step.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
                <span className="font-medium text-gray-900">
                  <span className="mr-2 text-gray-400">{i + 1}.</span>
                  {step.label}
                </span>
                <span className="tabular-nums text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {fmtNum(step.count)}
                  </span>
                  {i > 0 && (
                    <>
                      {" · "}
                      {fmtPct(step.rateFromStart)} of start
                      {" · "}
                      <span
                        className={isDrop ? "font-semibold text-amber-700" : ""}
                      >
                        {fmtPct(step.rateFromPrev)} of previous
                      </span>
                    </>
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${isDrop ? "bg-amber-500" : i === steps.length - 1 ? "bg-red-500" : "bg-indigo-500"}`}
                  style={{
                    width: `${(step.rateFromStart ?? (i === 0 && step.count ? 1 : 0)) * 100}%`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      {drop && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span className="font-semibold">Biggest drop-off:</span> {drop.from} →{" "}
          {drop.to}, {fmtPct(drop.lost)} lost
        </p>
      )}
    </div>
  );
}
