import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {FALLBACK_STARTER, QUESTIONS, STARTER_ORDER, STARTERS} from "./config.mjs";
import {recommend} from "./engine.mjs";
import {conversationStarters, reachOutBrief} from "./reachOut.mjs";
import {QUIZ_ICONS} from "../../components/client/quiz/icons.mjs";

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
  experience: "returning",
  injuries: "yes",
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
const ALL = [ME, FRIENDS, TEEN, KID];

const lead = answers => ({
  firstName: answers.firstName,
  answers,
  recommendation: recommend(answers),
});
const section = (answers, id) => reachOutBrief(lead(answers)).sections.find(s => s.id === id);

describe("conversationStarters", () => {
  test("me → goal, experience, time", () => {
    assert.deepEqual(conversationStarters(ME), [
      STARTERS.goal.strength,
      STARTERS.experience.active,
      STARTERS.time.early,
    ]);
  });

  test("friends → goal, coming back to the gym, the friends", () => {
    assert.deepEqual(conversationStarters(FRIENDS), [
      "I see that you're looking to lose some weight?",
      "I see that you are just coming back to the gym?",
      STARTERS.who.friends,
    ]);
  });

  test("teen and kid talk to the parent about their child", () => {
    assert.deepEqual(conversationStarters(TEEN), [
      STARTERS.athleteGoal.speed,
      STARTERS.sport.football,
      STARTERS.time.evening,
    ]);
    assert.deepEqual(conversationStarters(KID), [
      "I see that your child wants to gain confidence?",
      "I see that your child plays soccer?",
      FALLBACK_STARTER,
    ]);
  });

  test("a lead with almost no answers still gets the fallback opener", () => {
    assert.deepEqual(conversationStarters({who: "me"}), [FALLBACK_STARTER]);
  });

  test("always three unique, easy 'I see that…?' lines", () => {
    for (const answers of ALL) {
      const starters = conversationStarters(answers);
      assert.equal(starters.length, 3, answers.firstName);
      assert.equal(new Set(starters).size, starters.length);
      for (const line of starters) {
        assert.match(line, /^I see that .+\?$/);
      }
    }
  });

  test("every starter in the bank is an 'I see that…?' line", () => {
    for (const copy of Object.values(STARTERS)) {
      for (const line of Object.values(copy)) assert.match(line, /^I see that .+\?$/);
    }
  });
});

describe("reachOutBrief", () => {
  test("Who? / Why? / When? / What Else?, in that order", () => {
    for (const answers of ALL) {
      const {sections} = reachOutBrief(lead(answers));
      assert.deepEqual(
        sections.map(s => s.title),
        ["Who?", "Why?", "When?", "What Else?"],
      );
      for (const s of sections.slice(0, 3)) assert.equal(s.items.length, 1);
    }
  });

  test("Who? for an adult and for a parent", () => {
    assert.deepEqual(section(ME, "who").items[0], {
      icon: "FaUser",
      text: "Training on their own",
      detail: null,
    });
    assert.deepEqual(section(TEEN, "who").items[0], {
      icon: "FaPersonRunning",
      text: "Parent of a teen athlete (13–18)",
      detail: "Football",
    });
  });

  test("Why? leads with the goal; adults add their experience", () => {
    assert.deepEqual(section(FRIENDS, "why").items[0], {
      icon: "FaFire",
      text: "Lose weight",
      detail: "Getting back into it",
    });
    assert.equal(section(KID, "why").items[0].text, "Confidence");
    assert.equal(section(KID, "why").items[0].detail, null);
  });

  test("When? joins days and time, with a fallback", () => {
    assert.equal(section(ME, "when").items[0].text, "3 days a week · Early bird");
    assert.equal(section(KID, "when").items[0].text, "Ask what works for them");
  });

  test("What Else? puts an injury first, then best fit, budget, style", () => {
    const items = section(FRIENDS, "else").items;
    assert.equal(items[0].text, "Mentioned an injury, ask gently");
    assert.equal(items[0].alert, true);
    assert.match(items[1].text, /^Best fit: /);
    assert.equal(items[2].text, "Budget: Under $30 a session");
    assert.ok(!section(ME, "else").items.some(i => i.alert));
    assert.equal(section(ME, "else").items.at(-1).text, "Likes: Big group energy");
  });

  test("missing recommendation falls back to recommend()", () => {
    const items = reachOutBrief({firstName: "Sam", answers: ME}).sections.find(s => s.id === "else").items;
    assert.equal(items[0].text, "Best fit: Group Training");
  });

  test("starters come along with the sections", () => {
    assert.deepEqual(reachOutBrief(lead(FRIENDS)).starters, conversationStarters(FRIENDS));
  });

  test("every icon resolves to a react-icons component", () => {
    for (const answers of ALL) {
      for (const s of reachOutBrief(lead(answers)).sections) {
        for (const item of s.items) {
          assert.equal(typeof QUIZ_ICONS[item.icon], "function", `${answers.who} ${s.id}: ${item.icon}`);
        }
      }
    }
  });
});

test("starter keys match real questions and options", () => {
  const byId = new Map(QUESTIONS.map(q => [q.id, q]));
  for (const [id, copy] of Object.entries(STARTERS)) {
    const q = byId.get(id);
    assert.ok(q, `unknown question: ${id}`);
    for (const value of Object.keys(copy)) {
      assert.ok(q.options.some(o => o.value === value), `unknown option: ${id}.${value}`);
    }
  }
  for (const ids of Object.values(STARTER_ORDER)) {
    for (const id of ids) assert.ok(STARTERS[id], `STARTER_ORDER has no copy for ${id}`);
  }
});
