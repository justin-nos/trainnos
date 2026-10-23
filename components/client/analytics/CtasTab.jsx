"use client";
import {clicksByKind, delta} from "../../../lib/analytics/insights.mjs";
import BarTable from "./BarTable";
import Card from "./Card";
import StatCard from "./StatCard";
import {KIND_LABELS, fmtNum, fmtPct} from "./format";

const OUTBOUND = [
  {kind: "pushpress", label: "PushPress clicks"},
  {kind: "sms", label: "SMS taps"},
  {kind: "tel", label: "Phone taps"},
  {kind: "mailto", label: "Email taps"},
];

export default function CtasTab({data}) {
  const ctas = data.current.ctas;
  const cur = clicksByKind(ctas);
  const prev = clicksByKind(data.previous.ctas);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {OUTBOUND.map(({kind, label}) => (
          <StatCard
            key={kind}
            label={label}
            value={fmtNum(cur[kind] ?? 0)}
            delta={delta(cur[kind] ?? 0, prev[kind] ?? 0)}
          />
        ))}
      </div>
      <Card
        title="Buttons and links"
        description="Click-through rate is clicks ÷ views of the page the button gets most clicks on. Hovers are desktop only: the pointer rested on the button for half a second and the visitor didn't click."
      >
        <BarTable
          caption="Buttons and links"
          columns={[
            {key: "id", label: "CTA"},
            {
              key: "kind",
              label: "Kind",
              align: "left",
              format: k => KIND_LABELS[k] ?? k,
            },
            {key: "clicks", label: "Clicks", format: fmtNum},
            {key: "hovers", label: "Hovered, no click", format: fmtNum},
            {
              key: "ctr",
              label: "CTR",
              value: r => r.pages[0]?.ctr ?? null,
              format: (v, r) =>
                v === null ? "—" : `${fmtPct(v, 1)} on ${r.pages[0].path}`,
            },
          ]}
          rows={ctas}
          rowKey={r => r.id}
          barKey="clicks"
          limit={15}
          emptyText="No clicks recorded in this range."
          renderExpanded={row =>
            row.pages.length ? (
              <table className="text-sm">
                <caption className="sr-only">
                  Clicks on {row.id} by page
                </caption>
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th scope="col" className="pr-6 font-semibold">
                      Page
                    </th>
                    <th scope="col" className="pr-6 text-right font-semibold">
                      Clicks
                    </th>
                    <th scope="col" className="text-right font-semibold">
                      CTR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {row.pages.map(p => (
                    <tr key={p.path}>
                      <td className="pr-6 text-gray-900">{p.path}</td>
                      <td className="pr-6 text-right tabular-nums">
                        {fmtNum(p.clicks)}
                      </td>
                      <td className="text-right tabular-nums">
                        {fmtPct(p.ctr, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">Hovered only, no clicks.</p>
            )
          }
        />
      </Card>
    </div>
  );
}
