import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {decodeKey, decodeKeys, encodeKey, normalizePath} from "./keys.mjs";

describe("encodeKey / decodeKey", () => {
  test("round-trips paths, ids with dots and escape characters", () => {
    for (const key of [
      "/",
      "/testimonials/create",
      "v1.2.cta",
      "100%",
      "a`~*[b]",
      "__name__",
      "",
    ]) {
      const encoded = encodeKey(key);
      assert.doesNotMatch(encoded, /[./`~*[\]]/, encoded);
      assert.ok(!encoded.startsWith("_"), encoded);
      assert.equal(decodeKey(encoded), key);
    }
  });
  test("leaves ordinary keys alone", () => {
    assert.equal(encodeKey("hero-find-your-fit"), "hero-find-your-fit");
    assert.equal(encodeKey("Daphne, AL"), "Daphne, AL");
    assert.equal(encodeKey("/"), "%2F");
  });
  test("decodeKeys walks nested maps", () => {
    assert.deepEqual(
      decodeKeys({pages: {"%2Fpricing": {views: 2}}, date: "2026-10-23"}),
      {
        pages: {"/pricing": {views: 2}},
        date: "2026-10-23",
      },
    );
  });
});

describe("normalizePath", () => {
  test("never tracks admin or api paths", () => {
    assert.equal(normalizePath("/admins/analytics"), null);
    assert.equal(normalizePath("/admins"), null);
    assert.equal(normalizePath("/api/track"), null);
    assert.equal(normalizePath("nope"), null);
    assert.equal(normalizePath(undefined), null);
  });
  test("strips trailing slash, query and hash", () => {
    assert.equal(normalizePath("/pricing/"), "/pricing");
    assert.equal(normalizePath("/pricing?utm_source=x#top"), "/pricing");
    assert.equal(normalizePath("/"), "/");
  });
  test("collapses testimonial links and buckets unknown routes", () => {
    assert.equal(
      normalizePath("/testimonials/create/secret-slug"),
      "/testimonials/create",
    );
    assert.equal(normalizePath("/testimonials"), "/testimonials");
    assert.equal(normalizePath("/wp-login.php"), "other");
    assert.equal(normalizePath("/adminsx"), "other");
  });
});
