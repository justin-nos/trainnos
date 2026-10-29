import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {
  buildPayload,
  dailyMap,
  eventRow,
  leadRow,
  payloadCounts,
  sessionRow,
  testimonialRow,
  toIso,
} from "./firestoreRows.mjs";

// Stands in for a firebase-admin Timestamp.
const ts = iso => ({toDate: () => new Date(iso)});

describe("toIso", () => {
  test("Timestamps, Dates, millis and nulls", () => {
    assert.equal(toIso(ts("2026-10-28T12:00:00Z")), "2026-10-28T12:00:00.000Z");
    assert.equal(toIso(new Date("2026-10-28T12:00:00Z")), "2026-10-28T12:00:00.000Z");
    assert.equal(toIso(Date.parse("2026-10-28T12:00:00Z")), "2026-10-28T12:00:00.000Z");
    assert.equal(toIso(null), null);
    assert.equal(toIso(undefined), null);
  });
});

test("leadRow keeps the Firestore id and snake_cases fields", () => {
  const row = leadRow({
    id: "AbCdEfGhIjKlMnOpQrSt",
    data: {
      firstName: "Sam",
      phone: "+15555550100",
      consent: true,
      answers: {goal: "strength"},
      recommendation: {primary: "strength", alternate: "hiit"},
      status: "booked",
      source: "fit-quiz",
      attribution: {source: "google"},
      createdAt: ts("2026-10-25T15:00:00Z"),
    },
  });
  assert.deepEqual(row, {
    id: "AbCdEfGhIjKlMnOpQrSt",
    first_name: "Sam",
    phone: "+15555550100",
    consent: true,
    answers: {goal: "strength"},
    recommendation: {primary: "strength", alternate: "hiit"},
    status: "booked",
    source: "fit-quiz",
    attribution: {source: "google"},
    created_at: "2026-10-25T15:00:00.000Z",
    updated_at: null,
  });
});

test("testimonialRow uses createTime and the copied image path", () => {
  const row = testimonialRow(
    {id: "t1", data: {firstName: "Ana", lastName: "B", title: "Member", text: "Great"}, createTime: ts("2025-01-01T00:00:00Z")},
    "testimonialImages/t1.png",
  );
  assert.equal(row.created_at, "2025-01-01T00:00:00.000Z");
  assert.equal(row.image_path, "testimonialImages/t1.png");
  assert.equal(testimonialRow({id: "t2", data: {}}).image_path, null);
});

describe("sessionRow", () => {
  test("maps every field", () => {
    const row = sessionRow({
      id: "11111111-1111-4111-8111-111111111111",
      data: {
        vid: "v",
        startedAt: ts("2026-10-28T10:00:00Z"),
        lastSeenAt: ts("2026-10-28T10:05:00Z"),
        expireAt: ts("2027-11-27T10:00:00Z"),
        source: "google",
        medium: "organic",
        campaign: null,
        landing: "/",
        referrerHost: "www.google.com",
        device: "mobile",
        geo: "Daphne, AL",
        pageviews: 3,
        engagedMs: 1200,
        paths: ["/", "/start"],
        reached: {start: true},
        primary: "strength",
        leadId: "lead1",
      },
    });
    assert.deepEqual(row, {
      id: "11111111-1111-4111-8111-111111111111",
      vid: "v",
      started_at: "2026-10-28T10:00:00.000Z",
      last_seen_at: "2026-10-28T10:05:00.000Z",
      source: "google",
      medium: "organic",
      campaign: null,
      landing: "/",
      referrer_host: "www.google.com",
      device: "mobile",
      geo: "Daphne, AL",
      pageviews: 3,
      engaged_ms: 1200,
      paths: ["/", "/start"],
      reached: {start: true},
      primary: "strength",
      lead_id: "lead1",
      expire_at: "2027-11-27T10:00:00.000Z",
    });
  });

  test("a session first written by a non-start batch", () => {
    const row = sessionRow({id: "s", data: {vid: "v", lastSeenAt: ts("2026-10-28T10:00:00Z"), pageviews: 1}});
    assert.equal(row.started_at, null);
    assert.deepEqual(row.paths, []);
    assert.deepEqual(row.reached, {});
    assert.equal(row.expire_at, "2027-11-27T10:00:00.000Z");
  });
});

test("eventRow drops createdAt and keeps expireAt", () => {
  const row = eventRow({
    id: "e",
    data: {
      name: "pageview",
      path: "/",
      props: {sessionStart: true},
      ts: ts("2026-10-28T10:00:00Z"),
      vid: "v",
      sid: "s",
      createdAt: ts("2026-10-28T10:00:01Z"),
      expireAt: ts("2027-01-26T10:00:00Z"),
    },
  });
  assert.deepEqual(row, {
    name: "pageview",
    path: "/",
    props: {sessionStart: true},
    ts: "2026-10-28T10:00:00.000Z",
    vid: "v",
    sid: "s",
    expire_at: "2027-01-26T10:00:00.000Z",
  });
  assert.equal(
    eventRow({data: {name: "click", ts: ts("2026-10-28T10:00:00Z")}}).expire_at,
    "2027-01-26T10:00:00.000Z",
  );
});

test("dailyMap keys by day and drops date/updatedAt", () => {
  assert.deepEqual(
    dailyMap([{id: "2026-10-28", data: {date: "2026-10-28", updatedAt: ts("2026-10-28T12:00:00Z"), totals: {pageviews: 3}}}]),
    {"2026-10-28": {totals: {pageviews: 3}}},
  );
});

test("buildPayload and payloadCounts", () => {
  const payload = buildPayload({
    leads: [],
    testimonials: [{id: "t1", data: {}}, {id: "t2", data: {}}],
    emails: [{id: "a@example.com", data: {name: "A"}}],
    sessions: [],
    events: [],
    daily: [{id: "2026-10-28", data: {totals: {}}}],
    imagePaths: {t1: "testimonialImages/t1.jpeg"},
  });
  assert.deepEqual(payload.email_signups, [{email: "a@example.com", name: "A"}]);
  assert.deepEqual(payloadCounts(payload), {
    leads: 0,
    testimonials: 2,
    testimonialImages: 1,
    emails: 1,
    sessions: 0,
    events: 0,
    daily: 1,
  });
});
