import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {
  kidsSmsHref,
  nextQuestion,
  progress,
  pruneAnswers,
  recommend,
  sanitizeAnswers,
  visibleQuestions,
  wrappedSlides,
} from "./engine.mjs";

const ME = {
  who: "me",
  goal: "strength",
  experience: "active",
  style: "group",
  injuries: "no",
  days: "3",
  time: "early",
  budget: "30to50",
  firstName: "Sam",
};
const FRIENDS = {
  who: "friends",
  goal: "weight",
  experience: "new",
  injuries: "no",
  days: "1-2",
  time: "evening",
  budget: "under30",
  firstName: "Alex",
};
const TEEN = {
  who: "teen",
  sport: "football",
  athleteGoal: "speed",
  style: "group",
  days: "4+",
  time: "evening",
  budget: "under30",
  firstName: "Jordan",
};
const KID = {
  who: "kid",
  sport: "soccer",
  athleteGoal: "confidence",
  firstName: "Pat",
};

const ids = answers => visibleQuestions(answers).map(q => q.id);
const pick = answers => {
  const {primary, alternate} = recommend(answers);
  return [primary, alternate];
};

describe("recommend", () => {
  test("kid → kids, no alternate", () => {
    assert.deepEqual(pick(KID), ["kids", null]);
  });
  test("teen, solo, budget above $30 → private (alt groupAthlete)", () => {
    assert.deepEqual(pick({...TEEN, style: "solo", budget: "30to50"}), [
      "private",
      "groupAthlete",
    ]);
  });
  test("teen, solo, under $30 → groupAthlete, no alternate", () => {
    assert.deepEqual(pick({...TEEN, style: "solo", budget: "under30"}), [
      "groupAthlete",
      null,
    ]);
  });
  test("teen otherwise, $50+ → groupAthlete (alt private)", () => {
    assert.deepEqual(pick({...TEEN, budget: "50plus"}), [
      "groupAthlete",
      "private",
    ]);
  });
  test("teen otherwise, $30–$50 → groupAthlete, no alternate", () => {
    assert.deepEqual(pick({...TEEN, budget: "30to50"}), ["groupAthlete", null]);
  });
  test("friends → semiPrivate (alt groupAdult)", () => {
    assert.deepEqual(pick(FRIENDS), ["semiPrivate", "groupAdult"]);
  });
  test("me, needsCare, $50+ → private (alt semiPrivate)", () => {
    assert.deepEqual(pick({...ME, style: "solo", budget: "50plus"}), [
      "private",
      "semiPrivate",
    ]);
  });
  test("me, needsCare, $30–$50 → semiPrivate (alt private)", () => {
    assert.deepEqual(pick({...ME, injuries: "yes", budget: "30to50"}), [
      "semiPrivate",
      "private",
    ]);
  });
  test("needsCare triggers on goal=pain alone", () => {
    assert.deepEqual(pick({...ME, goal: "pain", budget: "50plus"}), [
      "private",
      "semiPrivate",
    ]);
  });
  test("me, crew, budget above $30 → semiPrivate (alt groupAdult)", () => {
    assert.deepEqual(pick({...ME, style: "crew", budget: "50plus"}), [
      "semiPrivate",
      "groupAdult",
    ]);
  });
  test("me otherwise, budget above $30 → groupAdult (alt semiPrivate)", () => {
    assert.deepEqual(pick(ME), ["groupAdult", "semiPrivate"]);
  });
  test("me otherwise, under $30 → groupAdult, no alternate", () => {
    assert.deepEqual(pick({...ME, budget: "under30"}), ["groupAdult", null]);
  });
  test("me, needsCare, under $30 falls through to groupAdult", () => {
    assert.deepEqual(pick({...ME, style: "solo", budget: "under30"}), [
      "groupAdult",
      null,
    ]);
  });
  test("returns 2–3 reasons for every branch", () => {
    for (const a of [
      ME,
      FRIENDS,
      TEEN,
      KID,
      {...ME, style: "solo", injuries: "yes", goal: "pain", budget: "50plus"},
    ]) {
      const {reasons} = recommend(a);
      assert.ok(
        reasons.length >= 2 && reasons.length <= 3,
        JSON.stringify(reasons),
      );
    }
  });
  test("mentions the budget when the program fits it", () => {
    const {reasons} = recommend({...ME, style: "solo", budget: "50plus"});
    assert.ok(reasons.includes("You want one-on-one attention"));
    assert.ok(reasons.includes("Fits your $50+ per-session budget"));
  });
});

describe("visibleQuestions", () => {
  test("adult sees 9 screens", () => {
    assert.deepEqual(ids(ME), [
      "who",
      "goal",
      "experience",
      "style",
      "injuries",
      "days",
      "time",
      "budget",
      "firstName",
    ]);
  });
  test("friends sees 8 screens (no style)", () => {
    assert.equal(ids(FRIENDS).length, 8);
    assert.ok(!ids(FRIENDS).includes("style"));
  });
  test("teen sees the 8 screens in the flow table", () => {
    assert.deepEqual(ids(TEEN), [
      "who",
      "sport",
      "athleteGoal",
      "style",
      "days",
      "time",
      "budget",
      "firstName",
    ]);
  });
  test("kid sees 4 screens", () => {
    assert.deepEqual(ids(KID), ["who", "sport", "athleteGoal", "firstName"]);
  });
});

describe("nextQuestion / progress", () => {
  test("starts on who and ends with null", () => {
    assert.equal(nextQuestion({}).id, "who");
    assert.equal(nextQuestion({who: "kid"}).id, "sport");
    assert.equal(nextQuestion(KID), null);
  });
  test("counts visible questions only", () => {
    assert.deepEqual(progress({who: "kid", sport: "soccer"}), {
      answered: 2,
      total: 4,
    });
    assert.deepEqual(progress(ME), {answered: 9, total: 9});
  });
});

describe("pruneAnswers", () => {
  test("switching who from me to kid drops adult-only answers", () => {
    const pruned = pruneAnswers({...ME, who: "kid"});
    assert.deepEqual(pruned, {who: "kid", firstName: "Sam"});
    assert.equal(nextQuestion(pruned).id, "sport");
  });
});

describe("sanitizeAnswers", () => {
  test("accepts a complete branch and trims the name", () => {
    const res = sanitizeAnswers({...KID, firstName: "  Pat  "});
    assert.deepEqual(res, {ok: true, answers: KID});
  });
  test("drops answers to hidden questions", () => {
    const res = sanitizeAnswers({...KID, budget: "50plus"});
    assert.deepEqual(res, {ok: true, answers: KID});
  });
  test("rejects unknown keys", () => {
    assert.equal(sanitizeAnswers({...KID, admin: "yes"}).ok, false);
    assert.equal(
      sanitizeAnswers(JSON.parse('{"__proto__": {"x": 1}, "who": "kid"}')).ok,
      false,
    );
  });
  test("rejects invalid option values", () => {
    assert.equal(sanitizeAnswers({...ME, budget: "free"}).ok, false);
    assert.equal(sanitizeAnswers({...ME, days: 3}).ok, false);
  });
  test("rejects missing visible answers", () => {
    const {budget: _budget, ...missing} = ME;
    assert.equal(sanitizeAnswers(missing).ok, false);
  });
  test("rejects empty and 51-character names", () => {
    assert.equal(sanitizeAnswers({...KID, firstName: "   "}).ok, false);
    assert.equal(
      sanitizeAnswers({...KID, firstName: "x".repeat(51)}).ok,
      false,
    );
    assert.equal(sanitizeAnswers({...KID, firstName: "x".repeat(50)}).ok, true);
  });
  test("rejects non-objects", () => {
    for (const raw of [null, undefined, "kid", ["kid"]]) {
      assert.equal(sanitizeAnswers(raw).ok, false);
    }
  });
});

describe("wrappedSlides", () => {
  test("adult gets intro, goal, rhythm, vibe, match", () => {
    const slides = wrappedSlides(ME, recommend(ME));
    assert.deepEqual(
      slides.map(s => s.id),
      ["intro", "goal", "rhythm", "vibe", "match"],
    );
    assert.equal(slides[0].headline, "Sam, let's see what you're made of.");
    assert.equal(slides[2].headline, "3 days a week · Early Bird");
    assert.equal(slides[4].headline, "Group Training");
  });
  test("returning adult's vibe is Comeback Season", () => {
    const a = {...ME, experience: "returning"};
    const vibe = wrappedSlides(a, recommend(a)).find(s => s.id === "vibe");
    assert.equal(vibe.headline, "Comeback Season");
  });
  test("teen goal slide uses athleteGoal and vibe uses style", () => {
    const slides = wrappedSlides(TEEN, recommend(TEEN));
    assert.equal(slides.find(s => s.id === "goal").headline, "Speed & Agility");
    assert.equal(
      slides.find(s => s.id === "vibe").headline,
      "Big Group Energy",
    );
  });
  test("kid has no rhythm slide and includes the sport", () => {
    const slides = wrappedSlides(KID, recommend(KID));
    assert.ok(!slides.some(s => s.id === "rhythm"));
    assert.ok(slides.some(s => s.headline.includes("Soccer")));
    assert.equal(slides.at(-1).headline, "Kids Speed & Agility");
    assert.ok(slides.length >= 3 && slides.length <= 5);
  });
});

describe("kidsSmsHref", () => {
  test("texts Brannon with the name in an encoded body", () => {
    const href = kidsSmsHref("Pat & Co");
    assert.ok(href.startsWith("sms:+12518954302?body="));
    const body = decodeURIComponent(href.split("?body=")[1]);
    assert.equal(
      body,
      "Hey Brannon, this is Pat & Co. I'm interested in reserving a spot in the Kids Speed & Agility course.",
    );
    assert.ok(!href.includes(" "));
  });
});

describe("athlete copy (a parent is answering)", () => {
  test("teen style question talks about them", () => {
    const q = nextQuestion({
      who: "teen",
      sport: "soccer",
      athleteGoal: "speed",
    });
    assert.equal(q.id, "style");
    assert.equal(q.prompt, "How do they like to train?");
    assert.equal(q.options[0].label, "Just them + a coach");
  });
  test("adult style question still talks about you", () => {
    const {style: _style, ...answers} = ME;
    const q = visibleQuestions(answers).find(q => q.id === "style");
    assert.equal(q.prompt, "How do you like to train?");
    assert.equal(q.options[0].label, "Just me + a coach");
  });
  test("teen and kid slides say Their, adult slides say Your", () => {
    for (const a of [TEEN, KID]) {
      const [intro, ...rest] = wrappedSlides(a, recommend(a));
      assert.match(intro.headline, /your athlete/);
      assert.ok(
        rest.every(s => s.kicker.startsWith("Their")),
        a.who,
      );
    }
    const [, ...adult] = wrappedSlides(ME, recommend(ME));
    assert.ok(adult.every(s => s.kicker.startsWith("Your")));
  });
  test("teen reasons don't say 'you'", () => {
    const a = {...TEEN, style: "solo", budget: "50plus"};
    const {primary, reasons} = recommend(a);
    assert.equal(primary, "private");
    assert.ok(reasons.includes("One-on-one attention for your athlete"));
    assert.ok(!reasons.some(r => /\byou\b/i.test(r)), JSON.stringify(reasons));
  });
});
