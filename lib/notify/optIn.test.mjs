import {test} from "node:test";
import assert from "node:assert/strict";
import {BRAND, CONSENT_TEXT, validateOptIn} from "./optIn.mjs";

test("accepts a name, US mobile and consent", () => {
  assert.deepEqual(validateOptIn({name: " Brannon ", phone: "(251) 895-4302", consent: true}), {
    ok: true,
    optIn: {name: "Brannon", phone: "+12518954302"},
  });
});

test("rejects missing pieces", () => {
  const valid = {name: "Brannon", phone: "2518954302", consent: true};
  for (const [label, body] of Object.entries({
    "no name": {...valid, name: " "},
    "long name": {...valid, name: "a".repeat(61)},
    "bad phone": {...valid, phone: "555-1234"},
    "no consent": {...valid, consent: false},
    "consent as string": {...valid, consent: "true"},
    "not an object": null,
  })) {
    const result = validateOptIn(body);
    assert.equal(result.ok, false, label);
    assert.equal(typeof result.error, "string", label);
  }
});

test("consent text has the carrier-required disclosures", () => {
  assert.ok(CONSENT_TEXT.includes(BRAND));
  for (const phrase of [/Message frequency varies/, /Message and data rates may apply/, /STOP/, /HELP/]) {
    assert.match(CONSENT_TEXT, phrase);
  }
});
