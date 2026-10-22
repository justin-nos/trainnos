"use client";
import {FaArrowLeft} from "react-icons/fa6";

// Shared chrome for the quiz screens: progress bar, Back, step count, Start over.
// `progress` is {step, total}; step 0 hides the count and Start over.
export default function QuizFrame({progress, onBack, onRestart, children}) {
  const {step, total} = progress;
  return (
    <div className="min-h-dvh w-screen bg-gray-950 pb-16 pt-28 text-white">
      <div className="mx-auto max-w-3xl px-6">
        <div
          className="h-1 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={step}
        >
          <div
            className="h-full rounded-full bg-red-500 transition-[width] duration-500 ease-out"
            style={{width: `${Math.round((step / total) * 100)}%`}}
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-white/60">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="-ml-2 inline-flex items-center gap-2 rounded-full px-2 py-1 font-semibold hover:text-white"
            >
              <FaArrowLeft aria-hidden="true" className="size-3" />
              Back
            </button>
          ) : (
            <span />
          )}
          {/* The total depends on "who", so it isn't shown until that's answered. */}
          <span>{step > 0 && `${step + 1} of ${total}`}</span>
          {step > 0 ? (
            <button
              type="button"
              onClick={onRestart}
              className="rounded-full px-2 py-1 hover:text-white"
            >
              Start over
            </button>
          ) : (
            <span />
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
