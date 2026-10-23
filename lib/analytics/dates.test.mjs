import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  clampTs,
  dayKey,
  dayRange,
  dayStart,
  parseRange,
  previousRange,
} from "./dates.mjs";

const params = q => new URLSearchParams(q);

describe("dayKey", () => {
  test("uses the Chicago date near midnight UTC", () => {
    // 2026-10-24 03:00 UTC is 22:00 CDT on the 23rd.
    assert.equal(dayKey(Date.parse("2026-10-24T03:00:00Z")), "2026-10-23");
    assert.equal(dayKey(Date.parse("2026-10-24T05:00:00Z")), "2026-10-24");
  });
  test("handles the 2026-11-01 DST change", () => {
    // CDT until 07:00 UTC on Nov 1, CST (UTC-6) after.
    assert.equal(dayKey(Date.parse("2026-11-01T04:59:00Z")), "2026-10-31");
    assert.equal(dayKey(Date.parse("2026-11-01T05:00:00Z")), "2026-11-01");
    assert.equal(dayKey(Date.parse("2026-11-02T05:59:00Z")), "2026-11-01");
    assert.equal(dayKey(Date.parse("2026-11-02T06:00:00Z")), "2026-11-02");
  });
});

describe("dayStart", () => {
  test("returns local midnight on both sides of DST", () => {
    assert.equal(dayStart("2026-10-23"), Date.parse("2026-10-23T05:00:00Z"));
    assert.equal(dayStart("2026-11-01"), Date.parse("2026-11-01T05:00:00Z"));
    assert.equal(dayStart("2026-11-02"), Date.parse("2026-11-02T06:00:00Z"));
    assert.equal(dayStart("2027-03-14"), Date.parse("2027-03-14T06:00:00Z"));
    assert.equal(dayStart("2027-03-15"), Date.parse("2027-03-15T05:00:00Z"));
  });
});

describe("ranges", () => {
  test("dayRange is inclusive and crosses months", () => {
    assert.deepEqual(dayRange("2026-10-30", "2026-11-02"), [
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    assert.deepEqual(dayRange("2026-10-23", "2026-10-23"), ["2026-10-23"]);
  });
  test("previousRange has the same length and ends the day before", () => {
    assert.deepEqual(previousRange("2026-10-17", "2026-10-23"), {
      from: "2026-10-10",
      to: "2026-10-16",
    });
    assert.deepEqual(previousRange("2026-03-01", "2026-03-01"), {
      from: "2026-02-28",
      to: "2026-02-28",
    });
  });
  test("addDays", () => {
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  });
});

describe("parseRange", () => {
  const now = Date.parse("2026-10-24T03:00:00Z"); // Oct 23 in Chicago
  test("defaults to the last 30 Chicago days", () => {
    assert.deepEqual(parseRange(params(""), now), {
      ok: true,
      from: "2026-09-24",
      to: "2026-10-23",
    });
  });
  test("accepts a valid range", () => {
    assert.deepEqual(parseRange(params("from=2026-10-01&to=2026-10-07"), now), {
      ok: true,
      from: "2026-10-01",
      to: "2026-10-07",
    });
  });
  test("rejects malformed, impossible, half or reversed ranges", () => {
    for (const q of [
      "from=2026-13-01&to=2026-10-07",
      "from=2026-02-30&to=2026-03-01",
      "from=2026-10-01",
      "from=10/01/2026&to=2026-10-07",
      "from=2026-10-07&to=2026-10-01",
    ]) {
      assert.equal(parseRange(params(q), now).ok, false, q);
    }
  });
  test("clamps to 400 days", () => {
    const r = parseRange(params("from=2020-01-01&to=2026-10-23"), now);
    assert.equal(dayRange(r.from, r.to).length, 400);
    assert.equal(r.to, "2026-10-23");
  });
});

describe("clampTs", () => {
  const now = 1_761_235_200_000;
  test("keeps nearby timestamps and replaces far or invalid ones", () => {
    assert.equal(clampTs(now - 5000, now), now - 5000);
    assert.equal(clampTs(0, now), now);
    assert.equal(clampTs(now + 25 * 3600 * 1000, now), now);
    assert.equal(clampTs("123", now), now);
    assert.equal(clampTs(NaN, now), now);
  });
});
