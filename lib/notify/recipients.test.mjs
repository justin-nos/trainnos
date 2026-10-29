import {test} from "node:test";
import assert from "node:assert/strict";
import {parseRecipients} from "./recipients.mjs";

test("parses names and normalizes phones, ignoring spacing", () => {
  assert.deepEqual(parseRecipients(" Brannon : (251) 895-4302 , Gavin:+12516566025 "), {
    recipients: [
      {name: "Brannon", phone: "+12518954302"},
      {name: "Gavin", phone: "+12516566025"},
    ],
    invalid: [],
  });
});

test("skips entries with a bad phone or no name", () => {
  assert.deepEqual(parseRecipients("Brannon:555-1234,:+12516566025,Gavin:+12516566025,junk"), {
    recipients: [{name: "Gavin", phone: "+12516566025"}],
    invalid: ["Brannon:555-1234", ":+12516566025", "junk"],
  });
});

test("an empty or missing env gives no recipients", () => {
  for (const value of ["", undefined, " , "]) {
    assert.deepEqual(parseRecipients(value), {recipients: [], invalid: []}, String(value));
  }
});
