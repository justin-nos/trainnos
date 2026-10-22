"use client";
import {useEffect, useRef, useState} from "react";
import {FaArrowRight} from "react-icons/fa6";
import {QUIZ_ICONS} from "./icons.mjs";
import QuizFrame from "./QuizFrame";

const ADVANCE_DELAY_MS = 250;

export default function QuestionStep({
  question,
  progress,
  onAnswer,
  onBack,
  onRestart,
}) {
  // The phone step after the last question counts as one more step.
  return (
    <QuizFrame
      progress={{step: progress.answered, total: progress.total + 1}}
      onBack={onBack}
      onRestart={onRestart}
    >
      {/* Keyed so each question remounts with fresh state and its entrance animation. */}
      <QuestionBody
        key={question.id}
        question={question}
        onAnswer={onAnswer}
        onBack={onBack}
      />
    </QuizFrame>
  );
}

function QuestionBody({question, onAnswer, onBack}) {
  const headingId = `quiz-${question.id}`;
  return (
    <div className="mt-12 animate-quiz-in sm:mt-16">
      <h1
        id={headingId}
        className="text-balance text-4xl font-bold tracking-tight sm:text-6xl"
      >
        {question.prompt}
      </h1>
      {question.type === "text" ? (
        <TextAnswer question={question} onAnswer={onAnswer} onBack={onBack} />
      ) : (
        <ChoiceAnswer
          question={question}
          headingId={headingId}
          onAnswer={onAnswer}
          onBack={onBack}
        />
      )}
    </div>
  );
}

function ChoiceAnswer({question, headingId, onAnswer, onBack}) {
  const [picked, setPicked] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const choose = value => {
    if (picked) return;
    setPicked(value);
    timer.current = setTimeout(() => onAnswer(value), ADVANCE_DELAY_MS);
  };

  useEffect(() => {
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey || picked) return;
      const index = Number(e.key) - 1;
      if (Number.isInteger(index) && question.options[index]) {
        e.preventDefault();
        choose(question.options[index].value);
      } else if ((e.key === "Backspace" || e.key === "Escape") && onBack) {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      role="radiogroup"
      aria-labelledby={headingId}
      className="mt-10 grid gap-3 sm:grid-cols-2"
    >
      {question.options.map((option, i) => {
        const Icon = QUIZ_ICONS[option.icon];
        const checked = picked === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => choose(option.value)}
            className={`flex min-h-16 items-center gap-4 rounded-2xl px-5 py-4 text-left text-lg font-semibold ring-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 ${
              checked
                ? "bg-red-500 ring-red-500"
                : "bg-white/5 ring-white/15 hover:ring-red-500"
            }`}
          >
            {Icon && (
              <Icon
                aria-hidden="true"
                className={`size-6 flex-none ${checked ? "text-white" : "text-red-500"}`}
              />
            )}
            <span className="flex-1">{option.label}</span>
            <kbd
              aria-hidden="true"
              className="hidden rounded-md px-2 py-0.5 font-sans text-xs text-white/40 ring-1 ring-white/15 sm:inline"
            >
              {i + 1}
            </kbd>
          </button>
        );
      })}
    </div>
  );
}

function TextAnswer({question, onAnswer, onBack}) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  return (
    <form
      className="mt-10 flex flex-col gap-4 sm:flex-row"
      onSubmit={e => {
        e.preventDefault();
        if (trimmed) onAnswer(trimmed);
      }}
    >
      <label htmlFor={`quiz-input-${question.id}`} className="sr-only">
        {question.prompt}
      </label>
      <input
        id={`quiz-input-${question.id}`}
        type="text"
        autoComplete="given-name"
        autoFocus
        maxLength={question.maxLength}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Escape" && onBack) onBack();
        }}
        placeholder="First name"
        className="min-h-16 flex-1 rounded-2xl bg-white/5 px-5 text-lg font-semibold text-white ring-1 ring-white/15 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      <button
        type="submit"
        disabled={!trimmed}
        className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-red-500 px-8 text-lg font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
        <FaArrowRight aria-hidden="true" className="size-4" />
      </button>
    </form>
  );
}
