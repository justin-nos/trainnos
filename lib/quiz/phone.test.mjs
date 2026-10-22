import {test} from "node:test";
import assert from "node:assert/strict";
import {formatUSPhone, normalizeUSPhone} from "./phone.mjs";

test("normalizes common US formats to E.164", () => {
  for (const input of ["(251) 895-4302", "251.895.4302", "+1 251 895 4302"]) {
    assert.equal(normalizeUSPhone(input), "+12518954302", input);
  }
});

test("rejects invalid numbers", () => {
  for (const input of ["555-1234", "123-456-7890", "", null, undefined]) {
    assert.equal(normalizeUSPhone(input), null, String(input));
  }
});

test("formats E.164 for display", () => {
  assert.equal(formatUSPhone("+12518954302"), "(251) 895-4302");
});
