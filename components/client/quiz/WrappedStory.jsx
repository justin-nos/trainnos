"use client";
import {useEffect, useRef, useState} from "react";
import {FaArrowLeft, FaArrowRight} from "react-icons/fa6";
import {QUIZ_ICONS} from "./icons.mjs";

const THEMES = {
  intro: "from-red-600 via-rose-500 to-orange-400",
  goal: "from-fuchsia-600 to-indigo-700",
  rhythm: "from-emerald-500 to-teal-800",
  vibe: "from-amber-400 to-red-600",
  match: "from-gray-950 via-red-900 to-red-600",
};

// A press shorter than this is a tap (navigate); longer is a hold (pause).
const TAP_MS = 250;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = e => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function WrappedStory({slides, onDone}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const press = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const slide = slides[index];
  const Icon = QUIZ_ICONS[slide.icon];

  const next = () => {
    if (index < slides.length - 1) setIndex(index + 1);
    else onDone();
  };
  const prev = () => setIndex(Math.max(0, index - 1));

  useEffect(() => {
    const {overflow} = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        onDone();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onPointerDown = e => {
    press.current = {at: Date.now(), x: e.clientX};
    setPaused(true);
  };
  const onPointerUp = e => {
    setPaused(false);
    if (!press.current) return;
    const {at, x} = press.current;
    press.current = null;
    if (Date.now() - at > TAP_MS) return;
    const {left, width} = e.currentTarget.getBoundingClientRect();
    if (x - left < width / 3) prev();
    else next();
  };
  const cancelPress = () => {
    press.current = null;
    setPaused(false);
  };
  // Keep taps on controls from also navigating the story.
  const stopPress = e => e.stopPropagation();

  const stagger = ms =>
    reducedMotion ? undefined : {animationDelay: `${ms}ms`};

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your fit, wrapped"
      className={`fixed inset-0 z-[60] touch-manipulation select-none overflow-hidden bg-linear-to-br text-white ${THEMES[slide.theme]}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={cancelPress}
      onPointerLeave={cancelPress}
      onContextMenu={e => e.preventDefault()}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-white/40 blur-3xl mix-blend-overlay"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 size-[28rem] rounded-full bg-black/40 blur-3xl mix-blend-overlay"
      />

      <div className="absolute inset-x-0 top-0 z-10 px-4 pt-4 sm:px-6">
        <div className="flex gap-1.5" aria-hidden="true">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              {i < index || (i === index && reducedMotion) ? (
                <div className="h-full bg-white" />
              ) : i === index ? (
                <div
                  key={index}
                  className="h-full origin-left animate-story-bar bg-white"
                  style={{animationPlayState: paused ? "paused" : "running"}}
                  onAnimationEnd={next}
                />
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
            NOS · Find Your Fit
          </p>
          <button
            type="button"
            onPointerDown={stopPress}
            onPointerUp={stopPress}
            onClick={onDone}
            className="rounded-full bg-black/20 px-4 py-1.5 text-sm font-semibold backdrop-blur hover:bg-black/30"
          >
            Skip
          </button>
        </div>
      </div>

      <div
        key={slide.id}
        aria-live="polite"
        className="relative flex h-full flex-col justify-center px-8 sm:mx-auto sm:max-w-3xl"
      >
        <p
          className="animate-quiz-in text-sm font-bold uppercase tracking-[0.2em] text-white/80"
          style={stagger(0)}
        >
          {slide.kicker}
        </p>
        {Icon && (
          <Icon
            aria-hidden="true"
            className="mt-8 size-24 animate-wrapped-pop drop-shadow-lg sm:size-32"
            style={stagger(150)}
          />
        )}
        <h2
          className="mt-8 text-balance text-5xl font-black leading-none tracking-tight animate-wrapped-pop sm:text-7xl"
          style={stagger(300)}
        >
          {slide.headline}
        </h2>
        <p
          className="mt-6 max-w-xl animate-quiz-in text-lg font-medium text-white/85 sm:text-2xl"
          style={stagger(450)}
        >
          {slide.sub}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-6 pb-8 text-sm text-white/70">
        <button
          type="button"
          onPointerDown={stopPress}
          onPointerUp={stopPress}
          onClick={prev}
          disabled={index === 0}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 font-semibold hover:text-white disabled:invisible"
        >
          <FaArrowLeft aria-hidden="true" className="size-3" />
          Back
        </button>
        <span aria-hidden="true">{reducedMotion ? "Tap to continue" : ""}</span>
        <button
          type="button"
          onPointerDown={stopPress}
          onPointerUp={stopPress}
          onClick={next}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 font-semibold hover:text-white"
        >
          {index === slides.length - 1 ? "See my fit" : "Next"}
          <FaArrowRight aria-hidden="true" className="size-3" />
        </button>
      </div>
    </div>
  );
}
