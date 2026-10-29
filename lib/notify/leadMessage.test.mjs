import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {recommend} from "../quiz/engine.mjs";
import {leadAlertText, makeAlertCode, parseInbound, toAscii, whichLeadText} from "./leadMessage.mjs";

const ME = {
  who: "me",
  goal: "strength",
  experience: "new",
  style: "crew",
  injuries: "yes",
  days: "1-2",
  time: "evening",
  budget: "30to50",
  firstName: "Sarah",
};
const FRIENDS = {...ME, who: "friends", injuries: "no", firstName: "Alex"};
const TEEN = {
  who: "teen",
  sport: "soccer",
  athleteGoal: "speed",
  style: "group",
  days: "4+",
  time: "evening",
  budget: "under30",
  firstName: "Jordan",
};
const KID = {who: "kid", sport: "football", athleteGoal: "confidence", firstName: "Pat"};

const lead = (answers, id = "abc123") => ({
  id,
  firstName: answers.firstName,
  phone: "+12515550134",
  answers,
  recommendation: recommend(answers),
  createdAt: "2026-10-26T20:12:00Z", // Mon 3:12pm CDT
});
const SITE = "https://trainnos.com";

describe("leadAlertText", () => {
  test("adult alert has the key facts, a tappable number, the link and code", () => {
    const text = leadAlertText(lead(ME), {siteUrl: SITE});
    const code = makeAlertCode("abc123");
    assert.equal(
      text,
      [
        "New NOS lead: Sarah",
        "Wants: Get stronger | Brand new",
        "Best fit: Semi-Private | 1-2 days/wk | After work/school",
        "! Mentioned an injury",
        "Call: (251) 555-0134",
        "https://trainnos.com/admins/leads?lead=abc123",
        `Reply DONE ${code} once you've reached out.`,
      ].join("\n"),
    );
  });

  test("friends, teen and kid leads say who signed up", () => {
    assert.match(leadAlertText(lead(FRIENDS), {siteUrl: SITE}), /^New NOS lead: Alex \(\+ 1-3 friends\)\n/);
    const teen = leadAlertText(lead(TEEN), {siteUrl: SITE});
    assert.match(teen, /^New NOS lead: Jordan \(parent of a teen athlete, Soccer\)\n/);
    assert.match(teen, /\nTheir goal: Speed & agility\n/);
    assert.match(teen, /\nBest fit: Athlete Group \| 4\+ days\/wk \| After work\/school\n/);
    const kid = leadAlertText(lead(KID), {siteUrl: SITE});
    assert.match(kid, /^New NOS lead: Pat \(parent of a young athlete, Football\)\n/);
    assert.match(kid, /\nBest fit: Kids Speed & Agility\n/);
  });

  test("every fixture has the name, phone, link and code", () => {
    for (const answers of [ME, FRIENDS, TEEN, KID]) {
      const text = leadAlertText(lead(answers, `id-${answers.firstName}`), {siteUrl: SITE});
      assert.ok(text.includes(answers.firstName));
      assert.ok(text.includes("(251) 555-0134"));
      assert.ok(text.includes(`${SITE}/admins/leads?lead=id-${answers.firstName}`));
      assert.ok(text.includes(`DONE ${makeAlertCode(`id-${answers.firstName}`)}`));
    }
  });

  test("injury line only when injuries is yes", () => {
    assert.match(leadAlertText(lead(ME), {siteUrl: SITE}), /Mentioned an injury/);
    assert.doesNotMatch(leadAlertText(lead(FRIENDS), {siteUrl: SITE}), /injury/);
    assert.doesNotMatch(leadAlertText(lead(TEEN), {siteUrl: SITE}), /injury/);
  });

  test("reminder replaces the first line and keeps the rest", () => {
    const alert = leadAlertText(lead(ME), {siteUrl: SITE}).split("\n");
    const reminder = leadAlertText(lead(ME), {siteUrl: SITE, reminder: true}).split("\n");
    assert.equal(reminder[0], "Reminder: Sarah is still New (came in Mon 3:12pm).");
    assert.deepEqual(reminder.slice(1), alert.slice(1));
    assert.doesNotMatch(alert[0], /Reminder/);
  });

  test("ASCII only and at most 480 characters (3 segments)", () => {
    for (const answers of [ME, FRIENDS, TEEN, KID]) {
      for (const reminder of [false, true]) {
        const text = leadAlertText(
          lead({...answers, firstName: "Bartholomew-Alexander"}, "f3c1a9d2-1b2c-4d5e-8f90-a1b2c3d4e5f6"),
          {siteUrl: SITE, reminder},
        );
        assert.match(text, /^[\x20-\x7E\n]*$/, text);
        assert.ok(text.length <= 480, `${text.length}: ${text}`);
      }
    }
  });
});

test("toAscii swaps typographic characters", () => {
  assert.equal(toAscii("1–3 friends — it’s “great”…"), '1-3 friends - it\'s "great"...');
  assert.equal(toAscii("José 💪"), "Jose ");
});

test("makeAlertCode is deterministic, 3 chars, no lookalikes", () => {
  assert.equal(makeAlertCode("abc123"), makeAlertCode("abc123"));
  const codes = new Set();
  for (let i = 0; i < 2000; i++) {
    const code = makeAlertCode(`lead-${i}`);
    assert.match(code, /^[A-HJ-NP-Z2-9]{3}$/);
    codes.add(code);
  }
  assert.ok(codes.size > 1500, `only ${codes.size} distinct codes`);
});

test("parseInbound", () => {
  assert.deepEqual(parseInbound("done"), {done: true, code: null});
  assert.deepEqual(parseInbound("  Done! "), {done: true, code: null});
  assert.deepEqual(parseInbound("DONE"), {done: true, code: null});
  assert.deepEqual(parseInbound("done k7p"), {done: true, code: "K7P"});
  assert.deepEqual(parseInbound("Done, K7P."), {done: true, code: "K7P"});
  assert.deepEqual(parseInbound("done thanks"), {done: true, code: null});
  assert.deepEqual(parseInbound("I'm done"), {done: false});
  assert.deepEqual(parseInbound("Who is this?"), {done: false});
  assert.deepEqual(parseInbound(""), {done: false});
  assert.deepEqual(parseInbound(undefined), {done: false});
});

test("whichLeadText lists the choices", () => {
  assert.equal(
    whichLeadText([
      {code: "K7P", firstName: "Sarah"},
      {code: "M2X", firstName: "Tom"},
    ]),
    "Which one? DONE K7P (Sarah), DONE M2X (Tom)",
  );
});
