import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {isAllowedOrigin, sanitizeBatch} from "./schema.mjs";
import {sanitizeHref} from "./source.mjs";

const VID = "6f1c2b9e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";
const SID = "0d9e8f7a-6b5c-4d3e-8f2a-1b0c9d8e7f6a";
const NOW = 1_761_235_200_000;
const batch = (events, extra = {}) => ({
  v: 1,
  vid: VID,
  sid: SID,
  session: {source: "google", medium: "organic", campaign: null, landing: "/"},
  events,
  ...extra,
});
const ev = (name, props = {}, path = "/") => ({name, ts: NOW, path, props});
const run = body => sanitizeBatch(body, {now: NOW});

describe("sanitizeBatch", () => {
  test("accepts a valid batch", () => {
    const res = run(
      batch([ev("pageview", {sessionStart: true, firstOfDay: true})]),
    );
    assert.equal(res.ok, true);
    assert.deepEqual(res.batch.events, [
      {
        name: "pageview",
        ts: NOW,
        path: "/",
        props: {sessionStart: true, firstOfDay: true},
      },
    ]);
    assert.deepEqual(res.batch.session, {
      source: "google",
      medium: "organic",
      campaign: null,
      landing: "/",
      referrerHost: null,
    });
  });
  test("rejects bad versions, ids and shapes", () => {
    assert.equal(run(null).ok, false);
    assert.equal(run("nope").ok, false);
    assert.equal(run(batch([], {v: 2})).ok, false);
    assert.equal(run(batch([], {vid: "not-a-uuid"})).ok, false);
    assert.equal(run(batch([], {sid: `${SID}x`})).ok, false);
    assert.equal(run(batch("events")).ok, false);
  });
  test("rejects oversized batches", () => {
    assert.equal(run(batch(Array(26).fill(ev("pageview")))).ok, false);
    assert.equal(run(batch(Array(25).fill(ev("pageview")))).ok, true);
  });
  test("drops unknown events and invalid props, keeps valid ones", () => {
    const res = run(
      batch([
        ev("identify", {name: "Sam"}),
        ev("pageview", {}, "/admins/analytics"),
        ev("scroll", {depth: 40}),
        ev("scroll", {depth: 50}),
        ev("engagement", {ms: -1}),
        ev("engagement", {ms: 2_000_000}),
        ev("engagement", {ms: 1200.4}),
        ev("click", {id: "x", kind: "teleport"}),
        ev("click", {id: "  ", kind: "internal"}),
        ev("click", {
          id: "hero-find-your-fit",
          kind: "internal",
          href: "/start",
          extra: 1,
        }),
        ev("quiz_completed", {primary: "nope"}),
        ev("quiz_completed", {primary: "kids", alternate: null, who: "kid"}),
      ]),
    );
    assert.deepEqual(
      res.batch.events.map(e => [e.name, e.props]),
      [
        ["scroll", {depth: 50}],
        ["engagement", {ms: 1200}],
        ["click", {id: "hero-find-your-fit", kind: "internal", href: "/start"}],
        ["quiz_completed", {primary: "kids", who: "kid"}],
      ],
    );
  });
  test("never accepts the name as a quiz step", () => {
    const res = run(
      batch([
        ev("quiz_step", {question_id: "firstName", value: "Sam"}, "/start"),
        ev("quiz_step", {question_id: "goal", value: "Sam"}, "/start"),
        ev("quiz_step", {question_id: "goal", value: "strength"}, "/start"),
      ]),
    );
    assert.deepEqual(
      res.batch.events.map(e => e.props),
      [{question_id: "goal", value: "strength"}],
    );
  });
  test("truncates strings and normalizes the session", () => {
    const res = run(
      batch(
        [
          ev("click", {
            id: "x".repeat(80),
            kind: "outbound",
            href: `https://a.com/${"y".repeat(300)}`,
          }),
        ],
        {
          session: {
            source: "S".repeat(50),
            landing: "/pricing/",
            referrerHost: "WWW.Google.com",
          },
        },
      ),
    );
    const [click] = res.batch.events;
    assert.equal(click.props.id.length, 60);
    assert.equal(click.props.href.length, 200);
    assert.equal(res.batch.session.source, "s".repeat(40));
    assert.equal(res.batch.session.medium, "none");
    assert.equal(res.batch.session.landing, "/pricing");
    assert.equal(res.batch.session.referrerHost, "www.google.com");
  });
  test("clamps timestamps to the server clock", () => {
    const res = run(batch([{name: "pageview", ts: 0, path: "/", props: {}}]));
    assert.equal(res.batch.events[0].ts, NOW);
  });
});

describe("sanitizeBatch: sections, hovers, forms", () => {
  test("accepts slug section ids and valid durations", () => {
    const res = run(
      batch([
        ev("section", {id: "hero", ms: 3000, seen: true}),
        ev("section", {id: "programs", ms: 1200.6}),
        ev("section", {id: "Hero Section", ms: 10}),
        ev("section", {id: "x".repeat(41), ms: 10}),
        ev("section", {id: "hero", ms: -5}),
        ev("section", {id: "hero", ms: 2_000_000}),
      ]),
    );
    assert.deepEqual(
      res.batch.events.map(e => e.props),
      [
        {id: "hero", ms: 3000, seen: true},
        {id: "programs", ms: 1201},
      ],
    );
  });
  test("accepts hovers with a known kind", () => {
    const res = run(
      batch([
        ev("hover", {id: "hero-find-your-fit", kind: "internal"}),
        ev("hover", {id: "hero-find-your-fit", kind: "nope"}),
        ev("hover", {kind: "internal"}),
      ]),
    );
    assert.deepEqual(
      res.batch.events.map(e => e.props),
      [{id: "hero-find-your-fit", kind: "internal"}],
    );
  });
  test("accepts only allowlisted form steps, never values", () => {
    const res = run(
      batch([
        ev(
          "form",
          {form: "contact", step: "phone_typed", value: "2515550123"},
          "/start",
        ),
        ev("form", {form: "contact", step: "phone_value"}, "/start"),
        ev("form", {form: "signup", step: "phone_typed"}, "/start"),
      ]),
    );
    assert.deepEqual(
      res.batch.events.map(e => e.props),
      [{form: "contact", step: "phone_typed"}],
    );
  });
});

describe("sanitizeHref", () => {
  test("keeps only the number for sms, tel and mailto", () => {
    assert.equal(
      sanitizeHref("sms:+12518954302?body=Hey%20Brannon%2C%20this%20is%20Sam"),
      "sms:+12518954302",
    );
    assert.equal(sanitizeHref("tel:+12518954302"), "tel:+12518954302");
    assert.equal(
      sanitizeHref("mailto:info@trainnos.com?subject=Hi%20from%20Sam"),
      "mailto:info@trainnos.com",
    );
  });
  test("keeps the PushPress category param only", () => {
    assert.equal(
      sanitizeHref(
        "https://trainnos.pushpress.com/landing/plans?category=plcat_uq5r4c5f9reo3d&ref=x#top",
      ),
      "https://trainnos.pushpress.com/landing/plans?category=plcat_uq5r4c5f9reo3d",
    );
  });
  test("removes other query strings and hashes", () => {
    assert.equal(
      sanitizeHref("https://example.com/a?name=Sam#b"),
      "https://example.com/a",
    );
    assert.equal(sanitizeHref("/start?utm_source=x"), "/start");
    assert.equal(sanitizeHref("javascript:alert(1)"), null);
    assert.equal(sanitizeHref(""), null);
    assert.equal(sanitizeHref(42), null);
  });
});

describe("isAllowedOrigin", () => {
  test("allows the site, previews and local dev", () => {
    for (const origin of [
      undefined,
      "https://trainnos.com",
      "https://www.trainnos.com",
      "https://nos-git-main-justin.vercel.app",
      "http://localhost:3000",
      "http://10.0.1.131:3000",
      "http://192.168.1.20:3000",
      "http://172.20.0.5:3000",
      "http://macbook.local:3000",
    ]) {
      assert.equal(isAllowedOrigin(origin), true, origin);
    }
  });
  test("rejects other sites and lookalikes", () => {
    for (const origin of [
      "https://evil.com",
      "https://trainnos.com.evil.com",
      "https://eviltrainnos.com",
      "http://172.32.0.1",
      "null",
    ]) {
      assert.equal(isAllowedOrigin(origin), false, origin);
    }
  });
});
