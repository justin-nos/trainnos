"use client";
import {useEffect, useMemo, useRef, useState} from "react";
import {track} from "../../../lib/analytics/client";
import {
  nextQuestion,
  progress,
  pruneAnswers,
  recommend,
  visibleQuestions,
  wrappedSlides,
} from "../../../lib/quiz/engine.mjs";
import ContactStep from "./ContactStep";
import FitSummary from "./FitSummary";
import QuestionStep from "./QuestionStep";
import WrappedStory from "./WrappedStory";

const STORAGE_KEY = "nos-fit-quiz-v1";
const STAGES = ["questions", "contact", "wrapped", "summary"];

function loadSaved() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved.answers !== "object" || !saved.answers) {
      return null;
    }
    const answers = pruneAnswers(saved.answers);
    const done = nextQuestion(answers) === null;
    let stage = STAGES.includes(saved.stage) ? saved.stage : "questions";
    // A stale stage snaps to what the answers allow. The story and summary are
    // only reachable after the lead was sent, so those can be restored as-is.
    if (!done) stage = "questions";
    else if (stage === "questions") stage = "contact";
    return {answers, stage};
  } catch {
    return null;
  }
}

function save(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage disabled: the quiz still works, just won't resume.
  }
}

export function clearSavedQuiz() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function FitQuiz() {
  const [answers, setAnswers] = useState({});
  const [stage, setStage] = useState("questions");
  const [hydrated, setHydrated] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setAnswers(saved.answers);
      setStage(saved.stage);
      started.current = Object.keys(saved.answers).length > 0;
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) save({answers, stage});
  }, [hydrated, answers, stage]);

  const question = nextQuestion(answers);
  const rec = useMemo(
    () => (question ? null : recommend(answers)),
    [question, answers],
  );
  const slides = useMemo(
    () => (rec ? wrappedSlides(answers, rec) : []),
    [answers, rec],
  );

  const answer = value => {
    if (!question) return;
    if (!started.current) {
      started.current = true;
      track("quiz_started");
    }
    // Never send the name to analytics.
    if (question.id !== "firstName") {
      track("quiz_step", {question_id: question.id, value: String(value)});
    }
    const next = pruneAnswers({...answers, [question.id]: value});
    setAnswers(next);
    if (nextQuestion(next) === null) {
      const done = recommend(next);
      track("quiz_completed", {
        primary: done.primary,
        alternate: done.alternate,
        who: next.who,
      });
      setStage("contact");
    }
  };

  const back = () => {
    const answered = visibleQuestions(answers).filter(
      q => answers[q.id] !== undefined,
    );
    const last = answered.at(-1);
    if (!last) return;
    const {[last.id]: _removed, ...rest} = answers;
    setAnswers(rest);
    setStage("questions");
  };

  const restart = () => {
    clearSavedQuiz();
    started.current = false;
    setAnswers({});
    setStage("questions");
  };

  const submitted = () => {
    // Leads are counted on the server, in /api/submitLead.
    setStage("wrapped");
  };

  // Before hydration this renders the first question, so the page is never
  // blank on a slow connection; saved progress is restored right after.
  if (question) {
    return (
      <QuestionStep
        question={question}
        progress={progress(answers)}
        onAnswer={answer}
        onBack={Object.keys(answers).length > 0 ? back : null}
        onRestart={restart}
      />
    );
  }

  if (stage === "contact") {
    const {total} = progress(answers);
    return (
      <ContactStep
        answers={answers}
        progress={{step: total, total: total + 1}}
        onSubmitted={submitted}
        onBack={back}
        onRestart={restart}
      />
    );
  }

  if (stage === "wrapped") {
    return <WrappedStory slides={slides} onDone={() => setStage("summary")} />;
  }

  return (
    <FitSummary
      answers={answers}
      rec={rec}
      onReplay={() => setStage("wrapped")}
      onRestart={restart}
    />
  );
}
