import {test} from "node:test";
import assert from "node:assert/strict";
import {MIN_SCHEDULE_MS, alertSendAt, reminderSendAt, shortCentralTime} from "./schedule.mjs";

// Late October 2026 is CDT (UTC−5): 12:00 CT = 17:00Z.
const ct = (date, time) => new Date(`${date}T${time}:00-05:00`);
const iso = d => d?.toISOString() ?? null;

test("alertSendAt sends daytime leads now", () => {
  for (const time of ["07:00", "12:00", "20:59"]) {
    assert.equal(alertSendAt(ct("2026-10-26", time)), null, time);
  }
});

test("alertSendAt holds overnight leads until 07:00 CT", () => {
  const sevenTuesday = "2026-10-27T12:00:00.000Z";
  assert.equal(iso(alertSendAt(ct("2026-10-26", "21:00"))), sevenTuesday);
  assert.equal(iso(alertSendAt(ct("2026-10-26", "23:59"))), sevenTuesday);
  assert.equal(iso(alertSendAt(ct("2026-10-27", "00:00"))), sevenTuesday);
  assert.equal(iso(alertSendAt(ct("2026-10-27", "06:44"))), sevenTuesday);
});

test("alertSendAt sends now when 07:00 is under 15 minutes away", () => {
  assert.equal(alertSendAt(ct("2026-10-27", "06:50")), null);
  assert.equal(alertSendAt(ct("2026-10-27", "06:46")), null);
});

test("reminderSendAt is 09:00 CT the day after the alert goes out", () => {
  // Mon 15:00 → Tue 09:00
  assert.equal(iso(reminderSendAt(ct("2026-10-26", "15:00"))), "2026-10-27T14:00:00.000Z");
  // Tue 01:00 → alert Tue 07:00 → Wed 09:00
  assert.equal(iso(reminderSendAt(ct("2026-10-27", "01:00"))), "2026-10-28T14:00:00.000Z");
  // Sat 22:00 → alert Sun 07:00 → Mon 09:00
  assert.equal(iso(reminderSendAt(ct("2026-10-24", "22:00"))), "2026-10-26T14:00:00.000Z");
});

test("spring forward (2026-03-08) lands on CDT instants", () => {
  // Sat 22:00 CST = 04:00Z Sunday
  const now = new Date("2026-03-08T04:00:00Z");
  assert.equal(iso(alertSendAt(now)), "2026-03-08T12:00:00.000Z"); // 07:00 CDT
  assert.equal(iso(reminderSendAt(now)), "2026-03-09T14:00:00.000Z"); // 09:00 CDT
});

test("fall back (2026-11-01) lands on CST instants", () => {
  // Sat 22:00 CDT = 03:00Z Sunday
  const now = new Date("2026-11-01T03:00:00Z");
  assert.equal(iso(alertSendAt(now)), "2026-11-01T13:00:00.000Z"); // 07:00 CST
  assert.equal(iso(reminderSendAt(now)), "2026-11-02T15:00:00.000Z"); // 09:00 CST
});

test("every scheduled time is at least 15 minutes out", () => {
  const start = new Date("2026-10-25T00:00:00Z").getTime();
  for (let t = start; t < start + 3 * 24 * 3600 * 1000; t += 7 * 60 * 1000) {
    const now = new Date(t);
    const alertAt = alertSendAt(now);
    if (alertAt) assert.ok(alertAt - now >= MIN_SCHEDULE_MS, now.toISOString());
    assert.ok(reminderSendAt(now) - now >= MIN_SCHEDULE_MS, now.toISOString());
  }
});

test("shortCentralTime", () => {
  assert.equal(shortCentralTime(ct("2026-10-26", "15:12")), "Mon 3:12pm");
  assert.equal(shortCentralTime(ct("2026-10-27", "09:05")), "Tue 9:05am");
});
