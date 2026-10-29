"use client";
import Link from "next/link";
import {useState} from "react";
import {CONSENT_TEXT, NAME_MAX, PROGRAM} from "../../lib/notify/optIn.mjs";

const INPUT =
  "mt-1 block w-full rounded-lg px-3 py-2.5 text-base text-gray-900 ring-1 ring-gray-300 focus:ring-2 focus:ring-gray-900 focus:outline-none";

// Staff opt-in for NOS Lead Alerts. The checkbox starts unchecked and the
// wording comes from lib/notify/optIn.mjs, which is also what gets stored.
export default function SmsOptInForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const submit = async e => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/smsOptIn", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name, phone, consent, website}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div
        role="status"
        className="rounded-2xl bg-green-50 p-6 text-green-900 ring-1 ring-green-200"
      >
        <h3 className="text-lg font-semibold">You&rsquo;re opted in to {PROGRAM}.</h3>
        <p className="mt-2">
          Thanks, {name.trim()}. An admin will add {phone} to the alert list, and you&rsquo;ll
          start getting a text when a new lead comes in. Message frequency varies (about 2
          messages per lead). Message and data rates may apply. Reply STOP at any time to opt
          out, or HELP for help.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      data-form="sms-opt-in"
      className="space-y-5 rounded-2xl bg-gray-50 p-6 ring-1 ring-gray-200"
    >
      <div>
        <label htmlFor="optin-name" className="block text-sm font-medium text-gray-900">
          Your name
        </label>
        <input
          id="optin-name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={NAME_MAX}
          autoComplete="name"
          required
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="optin-phone" className="block text-sm font-medium text-gray-900">
          Mobile number
        </label>
        <input
          id="optin-phone"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="(251) 555-0134"
          required
          className={INPUT}
        />
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="optin-website">Website</label>
        <input
          id="optin-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={e => setWebsite(e.target.value)}
        />
      </div>
      <label className="flex items-start gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
          required
          className="mt-0.5 size-5 flex-none accent-red-600"
        />
        <span>
          {CONSENT_TEXT} See our <Link href="/privacy">Privacy Policy</Link> and{" "}
          <Link href="/terms">Terms &amp; Conditions</Link>.
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!consent || status === "submitting"}
        className="w-full rounded-lg bg-gray-900 px-4 py-3 text-base font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {status === "submitting" ? "Saving…" : "Opt in to text alerts"}
      </button>
    </form>
  );
}
