"use client";
import {useEffect, useRef, useState} from "react";
import {fmtDay, fmtNum} from "./format";

const HEIGHT = 200;
const LEADS_HEIGHT = 36;
const PAD = {top: 12, right: 12, bottom: 24, left: 40};

// Rounds up to 1, 2 or 5 × 10^n so gridlines land on readable numbers.
function niceMax(n) {
  if (n <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 5, 10].find(s => s * pow >= n / 4) * pow;
  return Math.ceil(n / step) * step;
}

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

// Daily visitors as a line, with leads as bars in a strip below on the same
// x-axis (leads are too small to share the visitors scale).
export default function LineChart({series}) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState(null);
  const n = series.length;
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const yMax = niceMax(Math.max(...series.map(d => d.visitors), 0));
  const leadsMax = Math.max(...series.map(d => d.leads), 1);
  const x = i => PAD.left + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
  const y = v => PAD.top + innerH - (v / yMax) * innerH;

  const line = series
    .map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.visitors)}`)
    .join("");
  const area = `${line}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const tickEvery = Math.max(1, Math.ceil(n / 6));
  const grid = [0, 0.25, 0.5, 0.75, 1].map(f => f * yMax);
  const barW = Math.max(Math.min(innerW / n - 2, 14), 2);

  const pick = clientX => {
    const rect = ref.current.getBoundingClientRect();
    const i = Math.round(((clientX - rect.left - PAD.left) / innerW) * (n - 1));
    setActive(Math.min(Math.max(i, 0), n - 1));
  };
  const onKeyDown = e => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setActive(i => {
      const cur = i ?? n - 1;
      return Math.min(
        Math.max(cur + (e.key === "ArrowLeft" ? -1 : 1), 0),
        n - 1,
      );
    });
  };

  const day = active !== null ? series[active] : null;

  return (
    <div>
      <div className="mb-2 flex gap-4 text-xs font-medium text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-0.5 w-4 rounded bg-indigo-500"
          />
          Visitors
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-red-500" />
          Leads
        </span>
      </div>
      <div
        ref={ref}
        className="relative touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        tabIndex={0}
        role="img"
        aria-label="Daily visitors and leads. Use the left and right arrow keys to read each day."
        onKeyDown={onKeyDown}
        onPointerMove={e => pick(e.clientX)}
        onPointerDown={e => pick(e.clientX)}
        onPointerLeave={e => e.pointerType === "mouse" && setActive(null)}
        onBlur={() => setActive(null)}
      >
        {width > 0 && (
          <svg width={width} height={HEIGHT + LEADS_HEIGHT} aria-hidden="true">
            {grid.map(v => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(v)}
                  y2={y(v)}
                  className="stroke-gray-100"
                />
                <text
                  x={PAD.left - 8}
                  y={y(v)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-gray-400 text-[11px] tabular-nums"
                >
                  {fmtNum(v)}
                </text>
              </g>
            ))}
            <path d={area} className="fill-indigo-500/10" />
            <path
              d={line}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              className="stroke-indigo-500"
            />
            {series.map((d, i) =>
              i % tickEvery === 0 || i === n - 1 ? (
                <text
                  key={d.date}
                  x={x(i)}
                  y={HEIGHT - 6}
                  textAnchor={
                    i === 0 ? "start" : i === n - 1 ? "end" : "middle"
                  }
                  className="fill-gray-400 text-[11px]"
                >
                  {fmtDay(d.date)}
                </text>
              ) : null,
            )}
            {series.map((d, i) => {
              const h = d.leads
                ? Math.max((d.leads / leadsMax) * (LEADS_HEIGHT - 8), 3)
                : 0;
              return (
                <rect
                  key={d.date}
                  x={x(i) - barW / 2}
                  y={HEIGHT + LEADS_HEIGHT - h}
                  width={barW}
                  height={h}
                  rx={1.5}
                  className="fill-red-500"
                />
              );
            })}
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={HEIGHT + LEADS_HEIGHT - 0.5}
              y2={HEIGHT + LEADS_HEIGHT - 0.5}
              className="stroke-gray-200"
            />
            {day && (
              <g>
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={PAD.top}
                  y2={HEIGHT + LEADS_HEIGHT}
                  className="stroke-gray-300"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={x(active)}
                  cy={y(day.visitors)}
                  r={4}
                  className="fill-white stroke-indigo-500"
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>
        )}
        {day && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-max rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
            style={{
              left: Math.min(
                Math.max(x(active) - 70, 0),
                Math.max(width - 140, 0),
              ),
            }}
          >
            <p className="font-semibold">
              {fmtDay(day.date, {weekday: "short"})}
            </p>
            <p>{fmtNum(day.visitors)} visitors</p>
            <p>{fmtNum(day.sessions)} sessions</p>
            <p>{fmtNum(day.leads)} leads</p>
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {day
            ? `${fmtDay(day.date)}: ${day.visitors} visitors, ${day.sessions} sessions, ${day.leads} leads`
            : ""}
        </p>
      </div>
      <table className="sr-only">
        <caption>Daily visitors, sessions and leads</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Visitors</th>
            <th scope="col">Sessions</th>
            <th scope="col">Leads</th>
          </tr>
        </thead>
        <tbody>
          {series.map(d => (
            <tr key={d.date}>
              <th scope="row">{fmtDay(d.date)}</th>
              <td>{d.visitors}</td>
              <td>{d.sessions}</td>
              <td>{d.leads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
