"use client";
import {useState} from "react";
import BarTable from "./BarTable";
import Card from "./Card";
import {fmtDuration, fmtNum, fmtPct} from "./format";

const DIMENSION_COLUMNS = (label, withLeads = true) => [
  {key: "name", label},
  {key: "sessions", label: "Sessions", format: fmtNum},
  ...(withLeads
    ? [
        {key: "leads", label: "Leads", format: fmtNum},
        {key: "conversionRate", label: "Conversion", format: v => fmtPct(v, 1)},
      ]
    : []),
];

function Dimension({title, rows, label, withLeads, description}) {
  return (
    <Card title={title} description={description}>
      <BarTable
        caption={title}
        columns={DIMENSION_COLUMNS(label, withLeads)}
        rows={rows}
        rowKey={r => r.name}
        barKey="sessions"
      />
    </Card>
  );
}

function Sections({sections}) {
  const paths = Object.keys(sections).sort();
  const [path, setPath] = useState(paths.includes("/") ? "/" : paths[0]);
  const rows = sections[path] ?? [];
  return (
    <Card
      title="Sections"
      description="How far down each page people get, and how long each section stays on screen."
      action={
        paths.length > 0 && (
          <label className="text-sm text-gray-600">
            <span className="sr-only">Page</span>
            <select
              value={path}
              onChange={e => setPath(e.target.value)}
              className="rounded-md border-0 py-1.5 pl-2 pr-8 text-sm text-gray-900 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              {paths.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        )
      }
    >
      <BarTable
        caption={`Sections on ${path}`}
        columns={[
          {key: "id", label: "Section"},
          {key: "reachRate", label: "Reached", format: v => fmtPct(v)},
          {key: "views", label: "Views", format: fmtNum},
          {key: "avgMs", label: "Avg time on screen", format: fmtDuration},
        ]}
        rows={rows}
        rowKey={r => r.id}
        barKey="reachRate"
        defaultSort={{key: "views", dir: "desc"}}
        emptyText="No tagged sections seen in this range."
      />
    </Card>
  );
}

export default function PagesTab({data}) {
  const c = data.current;
  return (
    <div className="space-y-6">
      <Card title="Pages">
        <BarTable
          caption="Pages"
          columns={[
            {key: "path", label: "Page"},
            {key: "views", label: "Views", format: fmtNum},
            {key: "landings", label: "Landings", format: fmtNum},
            {key: "avgEngagedMs", label: "Avg time", format: fmtDuration},
            {key: "reach75Rate", label: "Scrolled 75%", format: v => fmtPct(v)},
          ]}
          rows={c.pages}
          rowKey={r => r.path}
          barKey="views"
        />
      </Card>
      <Sections sections={c.sections} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Dimension title="Sources" label="Source" rows={c.sources} />
        <Dimension title="Mediums" label="Medium" rows={c.mediums} />
        <Dimension
          title="Campaigns"
          label="Campaign"
          rows={c.campaigns}
          description="From utm_campaign links."
        />
        <Dimension
          title="Devices"
          label="Device"
          rows={c.devices}
          withLeads={false}
        />
        <Dimension title="Cities" label="City" rows={c.geo} withLeads={false} />
      </div>
    </div>
  );
}
