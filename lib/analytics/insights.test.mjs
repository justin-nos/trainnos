import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {INSIGHTS, TOTALS_FUNNEL} from "./config.mjs";
import {
  clicksByKind,
  delta,
  enoughData,
  headlineText,
  leadDriver,
  leak,
  totalsFunnel,
  watchSources,
  workingSources,
} from "./insights.mjs";
import {summarize} from "./summarize.mjs";

const src = (name, sessions, leads) => ({
  name,
  sessions,
  leads,
  conversionRate: sessions ? leads / sessions : null,
});

describe("leadDriver", () => {
  test("null when the net change is below the minimum", () => {
    assert.equal(
      leadDriver([src("google", 10, 3)], [src("google", 10, 2)]),
      null,
    );
  });
  test("picks the largest mover in the direction of the change", () => {
    const d = leadDriver(
      [src("instagram", 50, 6), src("google", 50, 3), src("direct", 50, 1)],
      [src("instagram", 50, 2), src("google", 50, 2), src("direct", 50, 2)],
    );
    assert.deepEqual(d, {name: "instagram", change: 4});
  });
  test("null when the top mover explains less than half the net change", () => {
    const d = leadDriver(
      [src("a", 9, 2), src("b", 9, 2), src("c", 9, 2)],
      [src("a", 9, 0), src("b", 9, 0), src("c", 9, 1)],
    );
    // net +5, biggest mover +2
    assert.equal(d, null);
  });
  test("counts sources that only exist in the previous period", () => {
    const d = leadDriver([src("direct", 20, 1)], [src("google", 20, 4)]);
    assert.deepEqual(d, {name: "google", change: -4});
  });
  test("ignores movers against the net direction", () => {
    const d = leadDriver(
      [src("a", 9, 6), src("b", 9, 0)],
      [src("a", 9, 1), src("b", 9, 3)],
    );
    assert.deepEqual(d, {name: "a", change: 5});
  });
});

describe("headlineText", () => {
  const days = 7;
  test("no leads in either period", () => {
    assert.equal(
      headlineText({leads: 0, prevLeads: 0, days}),
      "No leads yet, and none in the previous 7 days.",
    );
  });
  test("up from none, singular", () => {
    assert.equal(
      headlineText({leads: 1, prevLeads: 0, days}),
      "1 lead, up from none in the previous 7 days.",
    );
  });
  test("unchanged", () => {
    assert.equal(
      headlineText({leads: 4, prevLeads: 4, days}),
      "4 leads, the same as the previous 7 days.",
    );
  });
  test("up with a driver", () => {
    assert.equal(
      headlineText({
        leads: 14,
        prevLeads: 11,
        days,
        driver: {name: "instagram", change: 4},
      }),
      "14 leads, up from 11 in the previous 7 days, mostly from instagram (+4).",
    );
  });
  test("down with a driver", () => {
    assert.equal(
      headlineText({
        leads: 5,
        prevLeads: 9,
        days: 30,
        driver: {name: "google", change: -3},
      }),
      "5 leads, down from 9 in the previous 30 days, mostly because google brought 3 fewer.",
    );
  });
  test("change without a driver", () => {
    assert.equal(
      headlineText({leads: 3, prevLeads: 2, days, driver: null}),
      "3 leads, up from 2 in the previous 7 days.",
    );
  });
});

const current = ({
  sessions = 0,
  quizStarted = 0,
  quizCompleted = 0,
  phoneTyped = 0,
  leads = 0,
} = {}) =>
  summarize(
    [
      {
        date: "2026-10-23",
        totals: {sessions, quizStarted, quizCompleted, leads},
        forms: {contact: {phone_typed: phoneTyped}},
      },
    ],
    ["2026-10-23"],
  );

describe("totalsFunnel", () => {
  test("follows TOTALS_FUNNEL order with rates", () => {
    const steps = totalsFunnel(
      current({
        sessions: 200,
        quizStarted: 100,
        quizCompleted: 50,
        phoneTyped: 40,
        leads: 30,
      }),
    );
    assert.deepEqual(
      steps.map(s => s.key),
      TOTALS_FUNNEL.map(s => s.key),
    );
    assert.deepEqual(
      steps.map(s => s.count),
      [200, 100, 50, 40, 30],
    );
    assert.equal(steps[0].rateFromPrev, null);
    assert.equal(steps[0].rateFromStart, 1);
    assert.equal(steps[2].rateFromPrev, 0.5);
    assert.equal(steps[4].rateFromStart, 0.15);
  });
  test("caps a step that exceeds the one before", () => {
    const steps = totalsFunnel(current({sessions: 10, quizStarted: 12}));
    assert.equal(steps[1].count, 10);
  });
  test("missing contact form counts as zero", () => {
    const c = current({sessions: 10});
    delete c.forms;
    assert.equal(totalsFunnel(c)[3].count, 0);
  });
  test("empty range has null rates", () => {
    const steps = totalsFunnel(current());
    assert.equal(steps[0].rateFromStart, null);
    assert.equal(steps[1].rateFromPrev, null);
  });
});

describe("leak", () => {
  test("picks the largest loss and describes it", () => {
    const l = leak(
      totalsFunnel(
        current({
          sessions: 2104,
          quizStarted: 400,
          quizCompleted: 212,
          phoneTyped: 125,
          leads: 100,
        }),
      ),
    );
    assert.equal(l.from, "Visited site");
    assert.equal(l.to, "Answered first question");
    assert.equal(
      l.text,
      "Of 2,104 who visited, 81% never started the quiz.",
    );
  });
  test("skips transitions with too few people", () => {
    const min = INSIGHTS.minStepCount;
    const l = leak(
      totalsFunnel(
        current({
          sessions: 1000,
          quizStarted: 900,
          quizCompleted: min - 1,
          phoneTyped: 1,
          leads: 0,
        }),
      ),
    );
    // 900 → 19 is the biggest eligible loss; 19 → 1 is below the minimum.
    assert.equal(l.from, "Answered first question");
  });
  test("counts a step at exactly the minimum", () => {
    const min = INSIGHTS.minStepCount;
    const l = leak(
      totalsFunnel(
        current({
          sessions: 1000,
          quizStarted: 1000,
          quizCompleted: min,
          phoneTyped: 0,
          leads: 0,
        }),
      ),
    );
    assert.equal(l.from, "Finished quiz");
    assert.equal(l.lost, 1);
  });
  test("null when nobody is lost", () => {
    assert.equal(
      leak(
        totalsFunnel(
          current({
            sessions: 50,
            quizStarted: 50,
            quizCompleted: 50,
            phoneTyped: 50,
            leads: 50,
          }),
        ),
      ),
      null,
    );
  });
});

describe("workingSources", () => {
  const sources = [
    src("google", 400, 2),
    src("instagram", 100, 5),
    src("direct", 300, 0),
    src("facebook", 50, 2),
  ];
  test("ranks sources with leads by leads, then conversion", () => {
    const w = workingSources(sources, [src("instagram", 80, 1)]);
    assert.deepEqual(
      w.map(s => s.name),
      ["instagram", "facebook", "google"],
    );
    assert.equal(w[0].change, 4);
    assert.equal(w[1].change, 2);
  });
  test("respects the limit", () => {
    assert.equal(workingSources(sources, [], 1).length, 1);
  });
});

describe("watchSources", () => {
  const min = INSIGHTS.watchMinSessions;
  test("empty when the site has no leads", () => {
    assert.deepEqual(watchSources([src("google", 500, 0)], 0), []);
    assert.deepEqual(watchSources([src("google", 500, 0)], null), []);
  });
  test("flags busy sources converting far below the site rate", () => {
    const w = watchSources(
      [
        src("google", 400, 1), // 0.25%: flagged
        src("bing", 500, 0), // flagged
        src("tiny", min - 1, 0), // too little traffic
        src("instagram", 100, 5), // converting fine
        src("edge", min, 0), // exactly the minimum
      ],
      0.02,
    );
    assert.deepEqual(
      w.map(s => s.name),
      ["bing", "google", "edge"],
    );
  });
});

describe("clicksByKind", () => {
  test("sums clicks per kind", () => {
    assert.deepEqual(
      clicksByKind([
        {kind: "pushpress", clicks: 3},
        {kind: "sms", clicks: 1},
        {kind: "pushpress", clicks: 4},
      ]),
      {pushpress: 7, sms: 1},
    );
  });
  test("empty input", () => {
    assert.deepEqual(clicksByKind(), {});
  });
});

describe("delta and enoughData", () => {
  test("delta is null without a previous value", () => {
    assert.equal(delta(5, 0), null);
    assert.equal(delta(6, 4), 0.5);
  });
  test("enoughData uses the session minimum", () => {
    const min = INSIGHTS.minSessions;
    assert.equal(enoughData(current({sessions: min})), true);
    assert.equal(enoughData(current({sessions: min - 1})), false);
  });
});
