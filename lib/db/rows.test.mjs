import {test} from "node:test";
import assert from "node:assert/strict";
import {
  dailyFromRow,
  leadFromRow,
  leadToRow,
  sessionFromRow,
  trainerFromRow,
  trainerToRow,
} from "./rows.mjs";

const leadRow = {
  id: "abc",
  first_name: "Sam",
  phone: "+15555550100",
  consent: true,
  answers: {goal: "strength"},
  recommendation: {primary: "strength", alternate: "hiit"},
  status: "new",
  source: "fit-quiz",
  attribution: {source: "google", sessionId: "s"},
  created_at: "2026-10-28T12:00:00.123456+00:00",
  updated_at: null,
};

test("leadFromRow matches the old /api/leads shape", () => {
  assert.deepEqual(leadFromRow(leadRow), {
    id: "abc",
    firstName: "Sam",
    phone: "+15555550100",
    consent: true,
    answers: {goal: "strength"},
    recommendation: {primary: "strength", alternate: "hiit"},
    status: "new",
    source: "fit-quiz",
    attribution: {source: "google", sessionId: "s"},
    createdAt: "2026-10-28T12:00:00.123Z",
    updatedAt: null,
  });
});

test("leadToRow round-trips the insert fields", () => {
  const lead = leadFromRow(leadRow);
  const row = leadToRow(lead);
  assert.deepEqual(Object.keys(row).sort(), [
    "answers",
    "attribution",
    "consent",
    "first_name",
    "phone",
    "recommendation",
    "source",
    "status",
  ]);
  assert.equal(row.first_name, "Sam");
});

test("sessionFromRow fills nulls and converts timestamps", () => {
  const s = sessionFromRow({
    id: "s1",
    started_at: "2026-10-28T12:00:00+00:00",
    last_seen_at: "2026-10-28T12:05:00+00:00",
    engaged_ms: "1500",
    pageviews: 2,
    paths: ["/"],
    reached: {start: true},
    primary: "strength",
  });
  assert.deepEqual(s, {
    id: "s1",
    startedAt: "2026-10-28T12:00:00.000Z",
    lastSeenAt: "2026-10-28T12:05:00.000Z",
    landing: null,
    source: null,
    medium: null,
    campaign: null,
    device: null,
    geo: null,
    pageviews: 2,
    engagedMs: 1500,
    paths: ["/"],
    reached: {start: true},
    primary: "strength",
  });
  const empty = sessionFromRow({id: "s2"});
  assert.equal(empty.startedAt, null);
  assert.deepEqual(empty.paths, []);
  assert.deepEqual(empty.reached, {});
  assert.equal(empty.engagedMs, 0);
});

test("dailyFromRow looks like a Firestore daily doc", () => {
  assert.deepEqual(dailyFromRow({day: "2026-10-28", data: {totals: {pageviews: 3}}}), {
    date: "2026-10-28",
    totals: {pageviews: 3},
  });
});

const urlFor = path => `https://cdn.test/${path}`;
const trainerRow = {
  id: "gavin-willisson",
  name: "Gavin Willisson",
  position: "Head Coach",
  bio: "Bio",
  photo_path: "trainers/gavin-willisson/original.png",
  email: "gavin@trainnos.com",
  phone: null,
  active: true,
  sort_order: 0,
  created_at: "2026-10-29T12:00:00+00:00",
  updated_at: null,
  removed_at: null,
};

test("trainerFromRow builds the photo URL and camelCases fields", () => {
  assert.deepEqual(trainerFromRow(trainerRow, urlFor), {
    id: "gavin-willisson",
    name: "Gavin Willisson",
    position: "Head Coach",
    bio: "Bio",
    photo: {
      path: "trainers/gavin-willisson/original.png",
      url: "https://cdn.test/trainers/gavin-willisson/original.png",
    },
    email: "gavin@trainnos.com",
    phone: null,
    active: true,
    sortOrder: 0,
    createdAt: "2026-10-29T12:00:00.000Z",
    updatedAt: null,
    removedAt: null,
  });
});

test("trainerToRow maps only the keys present", () => {
  assert.deepEqual(trainerToRow({bio: "New", sortOrder: 3, email: null}), {
    bio: "New",
    sort_order: 3,
    email: null,
  });
  assert.deepEqual(
    trainerToRow({name: "Jane", position: "Head Coach", photoPath: "trainers/x/original.jpg"}),
    {name: "Jane", position: "Head Coach", photo_path: "trainers/x/original.jpg"},
  );
  assert.deepEqual(trainerToRow({}), {});
});
