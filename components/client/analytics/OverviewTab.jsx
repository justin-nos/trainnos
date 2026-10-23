"use client";
import Card from "./Card";
import LineChart from "./LineChart";
import StatCard from "./StatCard";
import {fmtDuration, fmtNum, fmtPct} from "./format";

export default function OverviewTab({data}) {
  const {current, deltas} = data;
  const t = current.totals;
  const topSource = current.sources[0];
  const topPage = current.pages[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Visitors"
          value={fmtNum(t.visitors)}
          delta={deltas.visitors}
        />
        <StatCard
          label="Sessions"
          value={fmtNum(t.sessions)}
          delta={deltas.sessions}
        />
        <StatCard
          label="Page views"
          value={fmtNum(t.pageviews)}
          delta={deltas.pageviews}
        />
        <StatCard label="Leads" value={fmtNum(t.leads)} delta={deltas.leads} />
        <StatCard
          label="Lead conversion"
          value={fmtPct(t.conversionRate, 1)}
          delta={deltas.conversionRate}
          hint="leads / sessions"
        />
        <StatCard
          label="Avg engaged time"
          value={fmtDuration(t.avgEngagedMs)}
          delta={deltas.avgEngagedMs}
          hint="per page view"
        />
      </div>
      <Card title="Visitors and leads by day">
        <LineChart series={current.series} />
      </Card>
      {(topSource || topPage) && (
        <p className="text-sm text-gray-600">
          {topSource && (
            <>
              Top source:{" "}
              <span className="font-semibold text-gray-900">
                {topSource.name}
              </span>{" "}
              ({fmtNum(topSource.sessions)} sessions, {fmtNum(topSource.leads)}{" "}
              {topSource.leads === 1 ? "lead" : "leads"})
            </>
          )}
          {topSource && topPage && " · "}
          {topPage && (
            <>
              Top page:{" "}
              <span className="font-semibold text-gray-900">
                {topPage.path}
              </span>{" "}
              ({fmtNum(topPage.views)} views)
            </>
          )}
        </p>
      )}
    </div>
  );
}
