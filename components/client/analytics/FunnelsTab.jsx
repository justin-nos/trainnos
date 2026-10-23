"use client";
import {useEffect, useState} from "react";
import {FUNNELS} from "../../../lib/analytics/config.mjs";
import BarTable from "./BarTable";
import Card from "./Card";
import FunnelChart from "./FunnelChart";
import RecentSessions from "./RecentSessions";
import {
  FORM_STEP_LABELS,
  answerLabel,
  fmtNum,
  fmtPct,
  programName,
  questionPrompt,
  shownWhen,
} from "./format";

const SELECT =
  "rounded-md border-0 py-1.5 pl-2 pr-8 text-sm text-gray-900 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500";

function Funnel({range}) {
  const [filters, setFilters] = useState({
    funnel: "quiz",
    source: "",
    device: "",
  });
  const [result, setResult] = useState(null);
  const [state, setState] = useState("loading");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    const params = new URLSearchParams({
      from: range.from,
      to: range.to,
      ...filters,
    });
    fetch(`/api/analytics/funnel?${params}`, {cache: "no-store"})
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        setResult(data);
        setState("ready");
      })
      .catch(error => {
        if (cancelled) return;
        console.error("Could not load funnel", error);
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, filters, reload]);

  const set = key => e => setFilters(f => ({...f, [key]: e.target.value}));
  const empty = result && result.funnel.steps[0].count === 0;

  return (
    <Card
      title="Funnel"
      description="Visits that started in this range. A visit only counts for a step if it reached every step before it."
      action={
        <div className="flex flex-wrap gap-2">
          <label>
            <span className="sr-only">Funnel</span>
            <select
              value={filters.funnel}
              onChange={set("funnel")}
              className={SELECT}
            >
              {Object.entries(FUNNELS).map(([key, f]) => (
                <option key={key} value={key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Source</span>
            <select
              value={filters.source}
              onChange={set("source")}
              className={SELECT}
            >
              <option value="">All sources</option>
              {(result?.sources ?? []).map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              {filters.source && !result?.sources.includes(filters.source) && (
                <option value={filters.source}>{filters.source}</option>
              )}
            </select>
          </label>
          <label>
            <span className="sr-only">Device</span>
            <select
              value={filters.device}
              onChange={set("device")}
              className={SELECT}
            >
              <option value="">All devices</option>
              {["mobile", "tablet", "desktop"].map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
      }
    >
      {state === "error" && (
        <p className="py-6 text-center text-sm text-red-600">
          Couldn&rsquo;t load the funnel.{" "}
          <button
            type="button"
            onClick={() => setReload(n => n + 1)}
            className="font-semibold underline"
          >
            Retry
          </button>
        </p>
      )}
      {state === "loading" && !result && (
        <p className="py-6 text-center text-sm text-gray-500">
          Loading funnel…
        </p>
      )}
      {result && state !== "error" && (
        <div className={state === "loading" ? "opacity-50" : ""}>
          {empty ? (
            <p className="py-6 text-center text-sm text-gray-500">
              No visits match these filters in this range.
            </p>
          ) : (
            <FunnelChart steps={result.funnel.steps} />
          )}
          {result.truncated && (
            <p className="mt-3 text-xs text-amber-700">
              Only the latest {fmtNum(result.sessionsRead)} visits were counted.
              Pick a shorter range for exact numbers.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function ContactForm({steps, leads}) {
  const typed = steps.find(s => s.step === "phone_typed")?.count ?? 0;
  const gaveUp = Math.max(typed - leads, 0);
  return (
    <Card
      title="Contact form"
      description="The step after the quiz where people enter a phone number. What they type is never recorded."
    >
      <dl className="divide-y divide-gray-100 text-sm">
        {steps.map(s => (
          <div key={s.step} className="flex justify-between gap-4 py-2">
            <dt className="text-gray-600">
              {FORM_STEP_LABELS[s.step] ?? s.step}
            </dt>
            <dd className="font-semibold tabular-nums text-gray-900">
              {fmtNum(s.count)}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-gray-600">Sent their number (leads)</dt>
          <dd className="font-semibold tabular-nums text-gray-900">
            {fmtNum(leads)}
          </dd>
        </div>
      </dl>
      {typed > 0 && (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {fmtNum(gaveUp)} of {fmtNum(typed)} people who started typing a number
          didn&rsquo;t send it ({fmtPct(gaveUp / typed)}).
        </p>
      )}
    </Card>
  );
}

function QuizQuestions({quiz, started}) {
  return (
    <Card
      title="Quiz questions"
      description="How many people answered each question, and what they picked."
    >
      <BarTable
        caption="Quiz questions"
        columns={[
          {
            key: "questionId",
            label: "Question",
            format: id => questionPrompt(id),
          },
          {key: "count", label: "Answered", format: fmtNum},
          {
            key: "rate",
            label: "Of quiz starts",
            value: r => (started ? r.count / started : null),
            format: v => fmtPct(v),
          },
        ]}
        rows={quiz.steps}
        rowKey={r => r.questionId}
        barKey="count"
        limit={20}
        defaultSort={{key: null, dir: "desc"}}
        emptyText="Nobody has answered the quiz in this range."
        renderExpanded={row => {
          const answers = quiz.answers[row.questionId] ?? [];
          const note = shownWhen(row.questionId);
          return (
            <div className="space-y-2">
              {note && <p className="text-xs text-gray-500">{note}</p>}
              <ul className="space-y-1">
                {answers.map(a => (
                  <li key={a.value} className="flex items-center gap-3 text-sm">
                    <span className="w-48 flex-none truncate text-gray-700">
                      {answerLabel(row.questionId, a.value)}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <span
                        className="block h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${row.count ? (a.count / row.count) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    <span className="w-20 flex-none text-right tabular-nums text-gray-600">
                      {fmtNum(a.count)} ·{" "}
                      {fmtPct(row.count ? a.count / row.count : null)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }}
      />
    </Card>
  );
}

export default function FunnelsTab({data, range}) {
  const c = data.current;
  return (
    <div className="space-y-6">
      <Funnel range={range} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ContactForm steps={c.forms.contact ?? []} leads={c.totals.leads} />
        <Card
          title="Recommendations"
          description="Which program the quiz picked."
        >
          <BarTable
            caption="Recommendations"
            columns={[
              {key: "program", label: "Program", format: programName},
              {key: "count", label: "Quizzes", format: fmtNum},
            ]}
            rows={c.quiz.results}
            rowKey={r => r.program}
            barKey="count"
            barClass="bg-red-100"
            emptyText="No finished quizzes in this range."
          />
        </Card>
      </div>
      <QuizQuestions quiz={c.quiz} started={c.totals.quizStarted} />
      <Card
        title="Recent visits"
        description="The latest visits, whatever the range."
      >
        <RecentSessions />
      </Card>
    </div>
  );
}
