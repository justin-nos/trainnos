import {test} from "node:test";
import assert from "node:assert/strict";
import {QUESTIONS} from "./config.mjs";
import {recommend, wrappedSlides} from "./engine.mjs";
import {QUIZ_ICONS} from "../../components/client/quiz/icons.mjs";

test("every option icon resolves to a react-icons component", () => {
  for (const q of QUESTIONS) {
    for (const o of q.options ?? []) {
      assert.equal(
        typeof QUIZ_ICONS[o.icon],
        "function",
        `${q.id}.${o.value}: ${o.icon}`,
      );
    }
  }
});

test("every slide icon resolves to a react-icons component", () => {
  const answers = {
    who: "me",
    goal: "strength",
    experience: "returning",
    style: "solo",
    injuries: "no",
    days: "3",
    time: "early",
    budget: "50plus",
    firstName: "Sam",
  };
  for (const slide of wrappedSlides(answers, recommend(answers))) {
    assert.equal(
      typeof QUIZ_ICONS[slide.icon],
      "function",
      `${slide.id}: ${slide.icon}`,
    );
  }
});
