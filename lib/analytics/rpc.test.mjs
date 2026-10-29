import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {ENV_FOR, leadParams, trackParams} from "./rpc.mjs";
import {buildLeadWrites, buildWrites} from "./rollup.mjs";

const T = Date.parse("2026-10-23T18:00:00Z");
const SID = "11111111-1111-4111-8111-111111111111";
const batch = events => ({
  vid: "v",
  sid: SID,
  session: {
    source: "google",
    medium: "organic",
    campaign: null,
    landing: "/",
    referrerHost: "www.google.com",
  },
  events: events.map(([name, props = {}, path = "/", ts = T]) => ({name, props, path, ts})),
});

describe("ENV_FOR", () => {
  test("only production is prod", () => {
    assert.equal(ENV_FOR("production"), "prod");
    assert.equal(ENV_FOR("preview"), "dev");
    assert.equal(ENV_FOR(undefined), "dev");
  });
});

describe("trackParams", () => {
  test("session start: ISO timestamps, expiries, set keys kept exactly", () => {
    const writes = buildWrites(batch([["pageview", {sessionStart: true}]]), {
      geo: null,
      device: "mobile",
    });
    const p = trackParams({env: "dev", sid: SID, writes, now: T});
    assert.equal(p.p_env, "dev");
    assert.equal(p.p_sid, SID);
    assert.equal(p.p_events[0].ts, "2026-10-23T18:00:00.000Z");
    assert.equal(p.p_events[0].sid, SID);
    assert.deepEqual(p.p_set, {
      vid: "v",
      startedAt: "2026-10-23T18:00:00.000Z",
      source: "google",
      medium: "organic",
      campaign: null,
      landing: "/",
      referrerHost: "www.google.com",
      device: "mobile",
      geo: null,
    });
    assert.ok(Object.hasOwn(p.p_set, "campaign"));
    assert.deepEqual(p.p_inc, {pageviews: 1});
    assert.deepEqual(p.p_paths, ["/"]);
    assert.equal(p.p_event_expire, "2027-01-21T18:00:00.000Z");
    assert.equal(p.p_session_expire, "2027-11-22T18:00:00.000Z");
    assert.deepEqual(p.p_daily, writes.daily);
  });

  test("non-start batch only sets vid; empty reached and paths become null", () => {
    const writes = buildWrites(batch([["engagement", {ms: 500}]]));
    const p = trackParams({env: "prod", sid: SID, writes, now: T});
    assert.deepEqual(p.p_set, {vid: "v"});
    assert.deepEqual(p.p_events, []);
    assert.equal(p.p_reached, null);
    assert.equal(p.p_paths, null);
    assert.deepEqual(p.p_inc, {engagedMs: 500});
  });

  test("reached is passed through when present", () => {
    const writes = buildWrites(batch([["pageview", {}, "/start"]]));
    assert.deepEqual(trackParams({env: "dev", sid: SID, writes, now: T}).p_reached, {start: true});
  });
});

describe("leadParams", () => {
  test("passes set, reached and daily", () => {
    const writes = buildLeadWrites({
      session: {source: "google"},
      primary: "strength",
      leadId: "lead-1",
      now: T,
    });
    const p = leadParams({env: "prod", sid: SID, writes});
    assert.equal(p.p_sid, SID);
    assert.deepEqual(p.p_set, {leadId: "lead-1", primary: "strength"});
    assert.deepEqual(p.p_reached, {lead: true});
    assert.deepEqual(p.p_daily, writes.daily);
  });

  test("no session -> null sid", () => {
    const writes = buildLeadWrites({primary: "strength", leadId: "x", now: T});
    assert.equal(leadParams({env: "dev", sid: undefined, writes}).p_sid, null);
  });
});
