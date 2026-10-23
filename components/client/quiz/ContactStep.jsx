"use client";
import {useRef, useState} from "react";
import {FaArrowRight} from "react-icons/fa6";
import {getAnalyticsIds, track} from "../../../lib/analytics/client";
import {BRANNON_SMS} from "../../../lib/quiz/config.mjs";
import {normalizeUSPhone} from "../../../lib/quiz/phone.mjs";
import QuizFrame from "./QuizFrame";

const NOS_PHONE = "(251) 895-4302";

// The step between the last question and the Wrapped story: the lead is sent
// here, and the story only plays once the server has accepted it.
export default function ContactStep({
  answers,
  progress,
  onSubmitted,
  onBack,
  onRestart,
}) {
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [status, setStatus] = useState("idle");
  const tracked = useRef(new Set());

  // Each form step is sent once per visit to this screen, never with values.
  const step = name => {
    if (tracked.current.has(name)) return;
    tracked.current.add(name);
    track("form", {form: "contact", step: name});
  };

  const onSubmit = async e => {
    e.preventDefault();
    step("submit_attempt");
    if (!normalizeUSPhone(phone)) {
      step("phone_error");
      setPhoneError("Enter a valid US phone number, like (251) 555-0123.");
      return;
    }
    if (!consent) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/submitLead", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          firstName: answers.firstName,
          phone,
          consent,
          answers,
          website,
          analytics: getAnalyticsIds(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onSubmitted();
    } catch {
      step("submit_error");
      setStatus("error");
    }
  };

  return (
    <QuizFrame progress={progress} onBack={onBack} onRestart={onRestart}>
      <div className="relative mt-12 animate-quiz-in sm:mt-16">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          {answers.firstName}, your fit is ready.
        </h1>
        <p className="mt-4 text-lg text-white/70 sm:text-xl">
          Drop your number to see it. A coach will text you to help you get
          started.
        </p>
        <form className="mt-10 space-y-5" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="lead-phone" className="sr-only">
              Phone number
            </label>
            <input
              id="lead-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              autoFocus
              required
              placeholder="(251) 555-0123"
              value={phone}
              onChange={e => {
                setPhone(e.target.value);
                setPhoneError("");
                if (e.target.value.trim()) step("phone_typed");
                if (normalizeUSPhone(e.target.value)) step("phone_valid");
              }}
              onKeyDown={e => {
                if (e.key === "Escape" && onBack) onBack();
              }}
              aria-invalid={Boolean(phoneError)}
              aria-describedby={phoneError ? "lead-phone-error" : undefined}
              className={`block min-h-16 w-full rounded-2xl bg-white/5 px-5 text-lg font-semibold text-white ring-1 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                phoneError ? "ring-2 ring-red-500" : "ring-white/15"
              }`}
            />
            {phoneError && (
              <p id="lead-phone-error" className="mt-2 text-sm text-red-400">
                {phoneError}
              </p>
            )}
          </div>
          {/* Honeypot: hidden from people, tempting to bots. */}
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] size-px overflow-hidden"
          >
            <label htmlFor="lead-website">Website</label>
            <input
              id="lead-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={e => setWebsite(e.target.value)}
            />
          </div>
          <label className="flex items-start gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={e => {
                setConsent(e.target.checked);
                if (e.target.checked) step("consent_checked");
              }}
              className="mt-0.5 size-5 flex-none accent-red-500"
            />
            It&rsquo;s OK for No Off Season to call or text me about training.
          </label>
          {status === "error" && (
            <p role="alert" className="text-sm text-red-400">
              Something went wrong — text us at{" "}
              <a
                href={`sms:${BRANNON_SMS}`}
                data-track="quiz-text-brannon"
                className="whitespace-nowrap font-semibold underline"
              >
                {NOS_PHONE}
              </a>
              .
            </p>
          )}
          <button
            type="submit"
            disabled={status === "submitting" || !consent}
            className="inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-8 text-lg font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "submitting" ? "Sending…" : "Show me my fit"}
            {status !== "submitting" && (
              <FaArrowRight aria-hidden="true" className="size-4" />
            )}
          </button>
        </form>
      </div>
    </QuizFrame>
  );
}
