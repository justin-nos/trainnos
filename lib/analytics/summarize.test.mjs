import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {compare, summarize} from "./summarize.mjs";

const DAYS = ["2026-10-21", "2026-10-22", "2026-10-23"];
const DOCS = [
  {
    date: "2026-10-23",
    totals: {pageviews: 10, sessions: 4, visitors: 3, leads: 1, clicks: 2},
    pages: {
      "%2F": {views: 8, landings: 4, engagedMs: 40000, s75: 2},
      "%2Fpricing": {views: 2, engagedMs: 10000},
    },
    sources: {google: {sessions: 3, leads: 1}, direct: {sessions: 1}},
    ctas: {
      "hero-find-your-fit": {kind: "internal", clicks: 2, pages: {"%2F": 2}},
    },
    quiz: {
      steps: {goal: 2, who: 3},
      answers: {who: {me: 2, kid: 1}},
      results: {groupAdult: 1},
    },
    updatedAt: {seconds: 1},
  },
  {
    date: "2026-10-21",
    totals: {pageviews: 2, sessions: 1, visitors: 1},
    pages: {"%2F": {views: 2, landings: 1}},
    sources: {google: {sessions: 1}},
    ctas: {
      "hero-find-your-fit": {kind: "internal", clicks: 1, pages: {"%2F": 1}},
    },
  },
];

describe("summarize", () => {
  const s = summarize(DOCS, DAYS);
  test("zero-fills missing days in order", () => {
    assert.deepEqual(s.series, [
      {date: "2026-10-21", visitors: 1, sessions: 1, pageviews: 2, leads: 0},
      {date: "2026-10-22", visitors: 0, sessions: 0, pageviews: 0, leads: 0},
      {date: "2026-10-23", visitors: 3, sessions: 4, pageviews: 10, leads: 1},
    ]);
  });
  test("sums totals and rates", () => {
    assert.equal(s.hasData, true);
    assert.equal(s.totals.pageviews, 12);
    assert.equal(s.totals.sessions, 5);
    assert.equal(s.totals.leads, 1);
    assert.equal(s.totals.conversionRate, 1 / 5);
    assert.equal(s.totals.avgEngagedMs, 50000 / 12);
  });
  test("decodes pages and computes per-page rates", () => {
    assert.deepEqual(s.pages[0], {
      path: "/",
      views: 10,
      landings: 5,
      avgEngagedMs: 4000,
      reach75Rate: 0.2,
    });
    assert.deepEqual(s.pages[1], {
      path: "/pricing",
      views: 2,
      landings: 0,
      avgEngagedMs: 5000,
      reach75Rate: 0,
    });
  });
  test("sorts sources and computes conversion", () => {
    assert.deepEqual(s.sources, [
      {name: "google", sessions: 4, leads: 1, conversionRate: 0.25},
      {name: "direct", sessions: 1, leads: 0, conversionRate: 0},
    ]);
    assert.deepEqual(s.campaigns, []);
  });
  test("computes CTA click-through against page views", () => {
    assert.deepEqual(s.ctas, [
      {
        id: "hero-find-your-fit",
        kind: "internal",
        clicks: 3,
        hovers: 0,
        pages: [{path: "/", clicks: 3, ctr: 0.3}],
      },
    ]);
  });
  test("orders quiz steps by the quiz flow", () => {
    assert.deepEqual(s.quiz.steps, [
      {questionId: "who", count: 3},
      {questionId: "goal", count: 2},
    ]);
    assert.deepEqual(s.quiz.answers.who, [
      {value: "me", count: 2},
      {value: "kid", count: 1},
    ]);
    assert.deepEqual(s.quiz.results, [{program: "groupAdult", count: 1}]);
  });
  test("never divides by zero", () => {
    const empty = summarize([], DAYS);
    assert.equal(empty.hasData, false);
    assert.equal(empty.totals.conversionRate, null);
    assert.equal(empty.totals.avgEngagedMs, null);
    assert.equal(empty.series.length, 3);
    const orphan = summarize(
      [
        {
          date: "2026-10-23",
          ctas: {x: {kind: "sms", clicks: 1, pages: {"%2Fmeet": 1}}},
          sources: {a: {leads: 1}},
        },
      ],
      DAYS,
    );
    assert.equal(orphan.ctas[0].pages[0].ctr, null);
    assert.equal(orphan.sources[0].conversionRate, null);
  });
});

describe("summarize: sections, hovers, forms", () => {
  const s = summarize(
    [
      {
        date: "2026-10-23",
        pages: {"%2F": {views: 10}},
        sections: {
          "%2F": {hero: {views: 10, ms: 50000}, courses: {views: 4, ms: 8000}},
          "%2Fmeet": {team: {views: 2, ms: 1000}},
        },
        ctas: {"hero-find-your-fit": {kind: "internal", hovers: 3}},
        forms: {contact: {phone_typed: 5, submit_attempt: 4}},
      },
    ],
    ["2026-10-23"],
  );
  test("computes section reach and time per page", () => {
    assert.deepEqual(s.sections["/"], [
      {id: "hero", views: 10, reachRate: 1, avgMs: 5000},
      {id: "courses", views: 4, reachRate: 0.4, avgMs: 2000},
    ]);
    assert.equal(s.sections["/meet"][0].reachRate, null);
  });
  test("reports hovers on CTAs with no clicks", () => {
    assert.deepEqual(s.ctas[0], {
      id: "hero-find-your-fit",
      kind: "internal",
      clicks: 0,
      hovers: 3,
      pages: [],
    });
  });
  test("lists every form step in order, zero-filled", () => {
    assert.deepEqual(s.forms.contact, [
      {step: "phone_typed", count: 5},
      {step: "phone_valid", count: 0},
      {step: "consent_checked", count: 0},
      {step: "submit_attempt", count: 4},
      {step: "phone_error", count: 0},
      {step: "submit_error", count: 0},
    ]);
  });
});

describe("compare", () => {
  test("returns relative change, null without a baseline", () => {
    const cur = summarize(DOCS, DAYS);
    const prev = summarize(
      [{date: "2026-10-20", totals: {pageviews: 6, sessions: 5, visitors: 4}}],
      ["2026-10-20"],
    );
    const d = compare(cur, prev);
    assert.equal(d.pageviews, 1);
    assert.equal(d.sessions, 0);
    assert.equal(d.visitors, 0);
    assert.equal(d.leads, null);
    assert.equal(d.conversionRate, null);
    assert.equal(compare(cur, summarize([], DAYS)).pageviews, null);
  });
});
