import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {buildLeadWrites, buildWrites} from "./rollup.mjs";

const T = Date.parse("2026-10-23T18:00:00Z"); // 1pm in Chicago
const batch = events => ({
  vid: "v",
  sid: "s",
  session: {
    source: "google",
    medium: "organic",
    campaign: "fall",
    landing: "/",
    referrerHost: "www.google.com",
  },
  events: events.map(([name, props = {}, path = "/", ts = T]) => ({
    name,
    props,
    path,
    ts,
  })),
});
const opts = {geo: "Daphne, AL", device: "mobile"};

describe("buildWrites", () => {
  test("counts session-start attribution once", () => {
    const {daily, session} = buildWrites(
      batch([
        ["pageview", {sessionStart: true, firstOfDay: true}],
        ["pageview", {sessionStart: true}, "/pricing"],
        ["pageview", {}, "/start"],
      ]),
      opts,
    );
    const day = daily["2026-10-23"];
    assert.deepEqual(day.totals, {pageviews: 3, visitors: 1, sessions: 1});
    assert.deepEqual(day.sources, {google: {sessions: 1}});
    assert.deepEqual(day.mediums, {organic: {sessions: 1}});
    assert.deepEqual(day.campaigns, {fall: {sessions: 1}});
    assert.deepEqual(day.devices, {mobile: {sessions: 1}});
    assert.deepEqual(day.geo, {"Daphne, AL": {sessions: 1}});
    assert.deepEqual(day.pages["%2F"], {views: 1, landings: 1});
    assert.deepEqual(day.pages["%2Fpricing"], {views: 1});
    assert.equal(session.set.startedAt, T);
    assert.equal(session.set.source, "google");
    assert.equal(session.set.device, "mobile");
    assert.deepEqual(session.inc, {pageviews: 3});
    assert.deepEqual(session.reached, {pricing: true, start: true});
    assert.deepEqual(session.paths, ["/", "/pricing", "/start"]);
  });
  test("leaves attribution out of batches without a session start", () => {
    const {daily, session} = buildWrites(
      batch([["pageview", {}, "/meet"]]),
      opts,
    );
    const day = daily["2026-10-23"];
    assert.equal(day.totals.sessions, undefined);
    assert.equal(day.sources, undefined);
    assert.deepEqual(session.set, {vid: "v"});
  });
  test("splits a batch that crosses Chicago midnight", () => {
    const beforeMidnight = Date.parse("2026-10-24T04:59:00Z");
    const afterMidnight = Date.parse("2026-10-24T05:01:00Z");
    const {daily} = buildWrites(
      batch([
        ["pageview", {}, "/", beforeMidnight],
        ["pageview", {}, "/", afterMidnight],
      ]),
      opts,
    );
    assert.deepEqual(Object.keys(daily).sort(), ["2026-10-23", "2026-10-24"]);
    assert.equal(daily["2026-10-23"].totals.pageviews, 1);
    assert.equal(daily["2026-10-24"].totals.pageviews, 1);
  });
  test("writes no raw docs for scroll or engagement", () => {
    const {events, daily, session} = buildWrites(
      batch([
        ["scroll", {depth: 25}],
        ["scroll", {depth: 50}],
        ["engagement", {ms: 4000}],
        ["engagement", {ms: 1000}],
      ]),
      opts,
    );
    assert.deepEqual(events, []);
    assert.deepEqual(daily["2026-10-23"].pages["%2F"], {
      s25: 1,
      s50: 1,
      engagedMs: 5000,
    });
    assert.deepEqual(session.inc, {engagedMs: 5000});
  });
  test("records clicks per CTA and page, and milestones", () => {
    const {events, daily, session} = buildWrites(
      batch([
        [
          "click",
          {
            id: "pricing-private",
            kind: "pushpress",
            href: "https://trainnos.pushpress.com/x",
          },
          "/pricing",
        ],
        ["click", {id: "pricing-private", kind: "pushpress"}, "/pricing"],
        ["click", {id: "v1.2", kind: "sms"}, "/"],
      ]),
      opts,
    );
    assert.equal(events.length, 3);
    assert.deepEqual(events[0], {
      name: "click",
      path: "/pricing",
      props: {
        id: "pricing-private",
        kind: "pushpress",
        href: "https://trainnos.pushpress.com/x",
      },
      ts: T,
      vid: "v",
      sid: "s",
    });
    const day = daily["2026-10-23"];
    assert.equal(day.totals.clicks, 3);
    assert.deepEqual(day.ctas["pricing-private"], {
      clicks: 2,
      pages: {"%2Fpricing": 2},
      kind: "pushpress",
    });
    assert.deepEqual(day.ctas["v1%2E2"], {
      clicks: 1,
      pages: {"%2F": 1},
      kind: "sms",
    });
    assert.deepEqual(session.reached, {pushpress: true, sms: true});
  });
  test("rolls up quiz events", () => {
    const {daily, session} = buildWrites(
      batch([
        ["quiz_started", {}, "/start"],
        ["quiz_step", {question_id: "who", value: "me"}, "/start"],
        ["quiz_step", {question_id: "goal", value: "strength"}, "/start"],
        [
          "quiz_completed",
          {primary: "groupAdult", alternate: "semiPrivate", who: "me"},
          "/start",
        ],
      ]),
      opts,
    );
    const day = daily["2026-10-23"];
    assert.deepEqual(day.totals, {quizStarted: 1, quizCompleted: 1});
    assert.deepEqual(day.quiz, {
      steps: {who: 1, goal: 1},
      answers: {who: {me: 1}, goal: {strength: 1}},
      results: {groupAdult: 1},
    });
    assert.deepEqual(session.reached, {quizStarted: true, quizCompleted: true});
    assert.equal(session.set.primary, "groupAdult");
  });
});

describe("buildWrites: sections, hovers, forms", () => {
  test("totals section reach and time without raw docs", () => {
    const {events, daily} = buildWrites(
      batch([
        ["section", {id: "hero", ms: 3000, seen: true}],
        ["section", {id: "hero", ms: 2000}],
        ["section", {id: "programs", ms: 0, seen: true}],
      ]),
      opts,
    );
    assert.deepEqual(events, []);
    assert.deepEqual(daily["2026-10-23"].sections, {
      "%2F": {hero: {views: 1, ms: 5000}, programs: {views: 1}},
    });
  });
  test("counts hovers on the CTA without raw docs", () => {
    const {events, daily} = buildWrites(
      batch([
        ["hover", {id: "pricing-private", kind: "pushpress"}, "/pricing"],
      ]),
      opts,
    );
    assert.deepEqual(events, []);
    assert.deepEqual(daily["2026-10-23"].ctas, {
      "pricing-private": {hovers: 1, kind: "pushpress"},
    });
    assert.equal(daily["2026-10-23"].totals, undefined);
  });
  test("counts form steps, keeps raw docs and marks phoneTyped", () => {
    const {events, daily, session} = buildWrites(
      batch([
        ["form", {form: "contact", step: "phone_typed"}, "/start"],
        ["form", {form: "contact", step: "phone_error"}, "/start"],
      ]),
      opts,
    );
    assert.equal(events.length, 2);
    assert.deepEqual(daily["2026-10-23"].forms, {
      contact: {phone_typed: 1, phone_error: 1},
    });
    assert.deepEqual(session.reached, {phoneTyped: true});
  });
});

describe("buildLeadWrites", () => {
  test("counts the lead against its session's attribution", () => {
    const res = buildLeadWrites({
      session: {source: "test", medium: "campaign", campaign: "qa"},
      primary: "kids",
      leadId: "abc",
      now: T,
    });
    assert.deepEqual(res.daily, {
      "2026-10-23": {
        totals: {leads: 1},
        sources: {test: {leads: 1}},
        mediums: {campaign: {leads: 1}},
        campaigns: {qa: {leads: 1}},
      },
    });
    assert.deepEqual(res.session, {
      set: {leadId: "abc", primary: "kids"},
      reached: {lead: true},
    });
  });
  test("falls back to an unknown source", () => {
    const res = buildLeadWrites({primary: "kids", now: T});
    assert.deepEqual(res.daily["2026-10-23"].sources, {unknown: {leads: 1}});
    assert.equal(res.daily["2026-10-23"].campaigns, undefined);
  });
});
