"use client";
import {Fragment, useMemo, useState} from "react";
import {ChevronDownIcon, ChevronRightIcon} from "@heroicons/react/20/solid";

const valueOf = (col, row) => (col.value ? col.value(row) : row[col.key]);

function sortRows(rows, columns, sort) {
  // A null sort key keeps the order rows were given in.
  const col = columns.find(c => c.key === sort.key);
  if (!col) return rows;
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = valueOf(col, a);
    const y = valueOf(col, b);
    if (x === y) return 0;
    if (x === null || x === undefined) return 1;
    if (y === null || y === undefined) return -1;
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * dir;
  });
}

// Sortable table; the `barKey` column draws a proportional bar behind its value.
// `highlightKey` tints the row with that rowKey and reveals it if past `limit`.
// columns: [{key, label, format?, align?: "left" | "right", value?: row => v}]
export default function BarTable({
  caption,
  columns,
  rows,
  rowKey,
  barKey,
  defaultSort,
  limit = 10,
  renderExpanded,
  emptyText = "Nothing recorded in this range.",
  barClass = "bg-indigo-100",
  highlightKey,
}) {
  const [sort, setSort] = useState(
    defaultSort ?? {key: barKey ?? columns[1]?.key, dir: "desc"},
  );
  const [showAll, setShowAll] = useState(() => {
    if (highlightKey == null) return false;
    const i = sortRows(rows, columns, sort).findIndex(
      r => rowKey(r) === highlightKey,
    );
    return i >= limit;
  });
  const [open, setOpen] = useState(() => new Set());

  const sorted = useMemo(
    () => sortRows(rows, columns, sort),
    [rows, columns, sort],
  );

  if (!rows.length) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">{emptyText}</p>
    );
  }

  const barCol = columns.find(c => c.key === barKey);
  const max = barCol
    ? Math.max(...rows.map(r => Number(valueOf(barCol, r)) || 0), 1)
    : 1;
  const visible = showAll ? sorted : sorted.slice(0, limit);
  const toggleSort = key =>
    setSort(s =>
      s.key === key
        ? {key, dir: s.dir === "desc" ? "asc" : "desc"}
        : {key, dir: "desc"},
    );
  const toggleRow = key =>
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[28rem] text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              {columns.map((col, i) => {
                const active = sort.key === col.key;
                const right =
                  col.align === "right" || (i > 0 && col.align !== "left");
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      active
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={`py-2 font-semibold ${right ? "text-right" : "text-left"} ${i > 0 ? "pl-4" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 uppercase hover:text-gray-900"
                    >
                      {col.label}
                      <span aria-hidden="true" className="w-2 text-gray-400">
                        {active ? (sort.dir === "asc" ? "↑" : "↓") : ""}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map(row => {
              const key = rowKey(row);
              const expanded = open.has(key);
              return (
                <Fragment key={key}>
                  <tr
                    className={`border-b border-gray-100 last:border-b-0 ${key === highlightKey ? "bg-amber-50" : ""}`}
                  >
                    {columns.map((col, i) => {
                      const v = valueOf(col, row);
                      const right =
                        col.align === "right" ||
                        (i > 0 && col.align !== "left");
                      const text = col.format ? col.format(v, row) : v;
                      const bar = col.key === barKey;
                      return (
                        <td
                          key={col.key}
                          className={`relative py-2 ${right ? "text-right tabular-nums" : "text-left"} ${i > 0 ? "pl-4" : "max-w-[16rem] truncate text-gray-900"}`}
                        >
                          {bar && (
                            <span
                              aria-hidden="true"
                              className={`absolute inset-y-1 left-0 rounded ${barClass}`}
                              style={{
                                width: `${((Number(v) || 0) / max) * 100}%`,
                              }}
                            />
                          )}
                          {i === 0 && renderExpanded ? (
                            <button
                              type="button"
                              onClick={() => toggleRow(key)}
                              aria-expanded={expanded}
                              className="inline-flex max-w-full items-center gap-1 truncate text-left hover:text-indigo-600"
                            >
                              {expanded ? (
                                <ChevronDownIcon
                                  aria-hidden="true"
                                  className="size-4 flex-none"
                                />
                              ) : (
                                <ChevronRightIcon
                                  aria-hidden="true"
                                  className="size-4 flex-none"
                                />
                              )}
                              <span className="truncate">{text}</span>
                            </button>
                          ) : (
                            <span className="relative">{text}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {expanded && (
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <td colSpan={columns.length} className="px-6 py-3">
                        {renderExpanded(row)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll(s => !s)}
          className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          {showAll ? "Show top 10" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}
