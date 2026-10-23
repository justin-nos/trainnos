import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {classifySource, clickKind, deviceFromUA, isBot} from "./source.mjs";

const SELF = ["trainnos.com"];
const pick = r => [r.source, r.medium];

describe("classifySource", () => {
  test("UTM beats the referrer", () => {
    const r = classifySource({
      utm: {utm_source: "Facebook", utm_campaign: "Fall-Promo"},
      referrer: "https://www.google.com/",
      selfHosts: SELF,
    });
    assert.deepEqual(r, {
      source: "facebook",
      medium: "campaign",
      campaign: "fall-promo",
      referrerHost: "www.google.com",
    });
    assert.equal(
      classifySource({utm: {utm_source: "x", utm_medium: "Email"}}).medium,
      "email",
    );
  });
  test("maps known referrers", () => {
    const cases = {
      "https://www.google.com/": ["google", "organic"],
      "https://www.google.co.uk/search": ["google", "organic"],
      "https://www.bing.com/": ["bing", "organic"],
      "https://duckduckgo.com/": ["duckduckgo", "organic"],
      "https://search.yahoo.com/": ["yahoo", "organic"],
      "https://l.facebook.com/l.php?u=x": ["facebook", "social"],
      "https://m.facebook.com/": ["facebook", "social"],
      "https://fb.me/abc": ["facebook", "social"],
      "https://l.instagram.com/": ["instagram", "social"],
      "https://chatgpt.com/": ["chatgpt", "ai"],
      "https://www.perplexity.ai/": ["perplexity", "ai"],
      "https://trainnos.pushpress.com/landing": ["pushpress", "referral"],
      "https://www.yelp.com/biz/nos": ["yelp.com", "referral"],
    };
    for (const [referrer, expected] of Object.entries(cases)) {
      assert.deepEqual(
        pick(classifySource({referrer, selfHosts: SELF})),
        expected,
        referrer,
      );
    }
  });
  test("empty or self referrer is direct", () => {
    assert.deepEqual(pick(classifySource({referrer: "", selfHosts: SELF})), [
      "direct",
      "none",
    ]);
    const self = classifySource({
      referrer: "https://trainnos.com/pricing",
      selfHosts: SELF,
    });
    assert.deepEqual(pick(self), ["direct", "none"]);
    assert.equal(self.referrerHost, null);
    assert.deepEqual(pick(classifySource({referrer: "garbage"})), [
      "direct",
      "none",
    ]);
  });
});

describe("clickKind", () => {
  test("classifies by scheme and host", () => {
    assert.equal(clickKind("sms:+12518954302?body=hi", "trainnos.com"), "sms");
    assert.equal(clickKind("tel:+12518954302", "trainnos.com"), "tel");
    assert.equal(clickKind("mailto:x@y.com", "trainnos.com"), "mailto");
    assert.equal(
      clickKind("https://trainnos.pushpress.com/landing/plans", "trainnos.com"),
      "pushpress",
    );
    assert.equal(
      clickKind("https://instagram.com/nos", "trainnos.com"),
      "outbound",
    );
    assert.equal(
      clickKind("https://trainnos.com/start", "trainnos.com"),
      "internal",
    );
    assert.equal(clickKind("/start", "trainnos.com"), "internal");
    assert.equal(clickKind(undefined, "trainnos.com"), "internal");
  });
});

describe("deviceFromUA / isBot", () => {
  test("detects devices", () => {
    const iphone =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
    const ipad =
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
    const androidTablet =
      "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/120 Safari/537.36";
    const androidPhone =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
    const mac =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15";
    assert.equal(deviceFromUA(iphone), "mobile");
    assert.equal(deviceFromUA(androidPhone), "mobile");
    assert.equal(deviceFromUA(ipad), "tablet");
    assert.equal(deviceFromUA(androidTablet), "tablet");
    assert.equal(deviceFromUA(mac), "desktop");
    assert.equal(deviceFromUA(), "desktop");
  });
  test("detects bots and empty UAs", () => {
    assert.equal(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
    assert.equal(isBot("facebookexternalhit/1.1"), true);
    assert.equal(isBot("Mozilla/5.0 HeadlessChrome/120"), true);
    assert.equal(isBot(""), true);
    assert.equal(isBot(undefined), true);
    assert.equal(
      isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"),
      false,
    );
  });
});
