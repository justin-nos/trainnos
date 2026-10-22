"use client";
import {useEffect} from "react";
import {CheckCircleIcon} from "@heroicons/react/20/solid";
import {FaArrowRight, FaDumbbell} from "react-icons/fa6";
import {PROGRAMS} from "../../../lib/quiz/config.mjs";
import {
  kidsSmsHref,
  selectedOption,
  visibleQuestions,
} from "../../../lib/quiz/engine.mjs";
import {QUIZ_ICONS} from "./icons.mjs";

const CARD =
  "rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur sm:p-8";

function programLink(programId, firstName) {
  const program = PROGRAMS[programId];
  return programId === "kids"
    ? {href: kidsSmsHref(firstName), external: false}
    : {href: program.href, external: true};
}

function ProgramButton({programId, firstName}) {
  const {href, external} = programLink(programId, firstName);
  return (
    <a
      href={href}
      {...(external ? {target: "_blank", rel: "noopener noreferrer"} : {})}
      className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-6 text-base font-semibold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 sm:w-auto"
    >
      {PROGRAMS[programId].cta}
      <FaArrowRight aria-hidden="true" className="size-4" />
    </a>
  );
}

export default function FitSummary({answers, rec, onReplay, onRestart}) {
  const program = PROGRAMS[rec.primary];
  const alternate = rec.alternate && PROGRAMS[rec.alternate];
  const chips = visibleQuestions(answers)
    .map(q => selectedOption(answers, q.id))
    .filter(Boolean);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-dvh w-screen bg-gray-950 pb-24 pt-28 text-white">
      <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        <header className="animate-quiz-in">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Your fit, wrapped
          </p>
          <h1 className="mt-3 bg-linear-to-r from-red-500 via-orange-300 to-red-500 bg-size-[200%_auto] bg-clip-text pb-1 text-5xl font-black tracking-tight text-transparent animate-bgload motion-reduce:animate-none sm:text-7xl">
            {answers.firstName}&rsquo;s Fit
          </h1>
          <div className="mt-4 flex gap-5 text-sm font-semibold text-white/60">
            <button
              type="button"
              onClick={onReplay}
              className="hover:text-white"
            >
              Replay story
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="hover:text-white"
            >
              Start over
            </button>
          </div>
        </header>

        <section aria-labelledby="fit-needs" className={CARD}>
          <h2
            id="fit-needs"
            className="text-sm font-semibold uppercase tracking-widest text-white/60"
          >
            What you told us
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {chips.map(option => {
              const Icon = QUIZ_ICONS[option.icon];
              return (
                <li
                  key={`${option.icon}-${option.wrapped}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold"
                >
                  {Icon && (
                    <Icon aria-hidden="true" className="size-4 text-red-400" />
                  )}
                  {option.wrapped}
                </li>
              );
            })}
          </ul>
        </section>

        <section
          aria-labelledby="fit-match"
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-red-600/30 via-gray-900 to-gray-900 p-6 ring-1 ring-red-500/40 sm:p-8"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-red-300">
            Your best fit
          </p>
          <h2
            id="fit-match"
            className="mt-3 text-4xl font-black tracking-tight sm:text-5xl"
          >
            {program.name}
          </h2>
          <p className="mt-2 text-lg text-white/80">{program.tagline}</p>
          <p className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
            {program.price}
          </p>
          <ul role="list" className="mt-6 space-y-3 text-base text-white/90">
            {rec.reasons.map(reason => (
              <li key={reason} className="flex gap-x-3">
                <CheckCircleIcon
                  aria-hidden="true"
                  className="h-6 w-5 flex-none text-red-500"
                />
                {reason}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <ProgramButton
              programId={rec.primary}
              firstName={answers.firstName}
            />
          </div>
          {alternate && (
            <p className="mt-5 text-sm text-white/70">
              Also worth a look:{" "}
              <a
                href={alternate.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white underline decoration-red-500 underline-offset-4 hover:text-red-300"
              >
                {alternate.name} <span aria-hidden="true">&rarr;</span>
              </a>
            </p>
          )}
        </section>

        <ThankYou name={answers.firstName} />
      </div>
    </div>
  );
}

function ThankYou({name}) {
  return (
    <section
      aria-live="polite"
      className={`${CARD} animate-quiz-in text-center`}
    >
      <FaDumbbell aria-hidden="true" className="mx-auto size-12 text-red-500" />
      <h2 className="mt-4 text-3xl font-bold tracking-tight">
        You&rsquo;re in, {name}.
      </h2>
      <p className="mt-2 text-lg text-white/80">
        Brannon or Gavin will reach out soon.
      </p>
    </section>
  );
}
