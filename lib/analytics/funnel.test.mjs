import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {biggestDrop, computeFunnel} from "./funnel.mjs";

const SESSIONS = [
  {
    source: "google",
    device: "mobile",
    reached: {
      start: true,
      quizStarted: true,
      quizCompleted: true,
      phoneTyped: true,
      lead: true,
    },
  },
  {
    source: "google",
    device: "desktop",
    reached: {start: true, quizStarted: true},
  },
  {source: "facebook", device: "mobile", reached: {start: true}},
  // Skipped /start (bad data): must not count toward later steps.
  {
    source: "direct",
    device: "mobile",
    reached: {quizCompleted: true, lead: true},
  },
  {
    source: "direct",
    device: "desktop",
    reached: {pricing: true, pushpress: true},
  },
  {source: "direct", device: "mobile"},
];
const counts = f => f.steps.map(s => s.count);

describe("computeFunnel", () => {
  test("is strictly non-increasing", () => {
    const f = computeFunnel(SESSIONS, "quiz");
    assert.deepEqual(counts(f), [6, 3, 2, 1, 1, 1]);
    assert.equal(f.label, "Find Your Fit");
    assert.equal(f.steps[1].rateFromStart, 0.5);
    assert.equal(f.steps[0].rateFromPrev, null);
    assert.equal(f.steps[2].rateFromPrev, 2 / 3);
  });
  test("pricing funnel", () => {
    assert.deepEqual(counts(computeFunnel(SESSIONS, "pricing")), [6, 1, 1]);
  });
  test("applies source and device filters", () => {
    assert.deepEqual(
      counts(computeFunnel(SESSIONS, "quiz", {source: "google"})),
      [2, 2, 2, 1, 1, 1],
    );
    assert.deepEqual(
      counts(computeFunnel(SESSIONS, "quiz", {device: "mobile"})),
      [4, 2, 1, 1, 1, 1],
    );
    assert.deepEqual(
      counts(
        computeFunnel(SESSIONS, "quiz", {source: "google", device: "desktop"}),
      ),
      [1, 1, 1, 0, 0, 0],
    );
  });
  test("handles no sessions", () => {
    const f = computeFunnel([], "quiz");
    assert.deepEqual(counts(f), [0, 0, 0, 0, 0, 0]);
    assert.equal(f.steps[1].rateFromStart, null);
  });
  test("a lead without the phone step doesn't count", () => {
    const f = computeFunnel(
      [
        {
          reached: {
            start: true,
            quizStarted: true,
            quizCompleted: true,
            lead: true,
          },
        },
      ],
      "quiz",
    );
    assert.deepEqual(counts(f), [1, 1, 1, 1, 0, 0]);
  });
  test("rejects unknown funnels", () => {
    assert.throws(() => computeFunnel([], "nope"));
  });
});

describe("biggestDrop", () => {
  test("finds the step that loses the largest share", () => {
    const drop = biggestDrop(
      computeFunnel(SESSIONS, "quiz", {source: "google"}).steps,
    );
    assert.deepEqual(drop, {
      from: "Answered first question",
      to: "Finished quiz",
      lost: 0.5,
    });
  });
  test("keeps the earliest step on a tie", () => {
    // [6, 3, 2, 1, 1, 1] loses 50% at visit → start and at quizStarted → quizCompleted.
    const drop = biggestDrop(computeFunnel(SESSIONS, "quiz").steps);
    assert.deepEqual(drop, {
      from: "Visited site",
      to: "Opened /start",
      lost: 0.5,
    });
  });
  test("returns null when nothing is lost", () => {
    assert.equal(biggestDrop(computeFunnel([], "quiz").steps), null);
  });
});
