"use client";
import {useEffect, useMemo} from "react";
import {FaMessage, FaPhone, FaXmark} from "react-icons/fa6";
import {formatUSPhone} from "../../lib/quiz/phone.mjs";
import {reachOutBrief} from "../../lib/quiz/reachOut.mjs";
import {QUIZ_ICONS} from "./quiz/icons.mjs";

// Reach Out: one glanceable sheet before calling a lead. Who? / Why? / When? /
// What Else? lead with the answer that matters most, then easy openers.
// Tapping Call marks the lead Contacted and dials.
export default function ReachOut({lead, onClose, onDialed}) {
  const {sections, starters} = useMemo(() => reachOutBrief(lead), [lead]);

  useEffect(() => {
    const {overflow} = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reach out to ${lead.firstName}`}
      className="fixed inset-0 z-[60] overflow-y-auto bg-[#faf6ee] text-gray-950"
    >
      <div className="mx-auto flex min-h-full max-w-xl flex-col gap-7 px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Reach out to
            </p>
            <h2 className="mt-1 text-4xl font-black tracking-tight">{lead.firstName}</h2>
            <p className="mt-1 text-lg font-medium">{formatUSPhone(lead.phone)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 ring-1 ring-gray-950/15 hover:bg-gray-950/5"
          >
            <FaXmark aria-hidden="true" className="size-5" />
          </button>
        </div>

        <dl className="space-y-5">
          {sections.map(section => (
            <div key={section.id}>
              <dt className="text-sm font-bold uppercase tracking-wide">{section.title}</dt>
              <dd>
                <ul className="mt-2 space-y-2">
                  {section.items.map(item => {
                    const Icon = QUIZ_ICONS[item.icon];
                    return (
                      <li key={item.text} className="flex items-start gap-3">
                        {Icon && (
                          <Icon
                            aria-hidden="true"
                            className={`mt-1 size-4 shrink-0 ${item.alert ? "text-red-600" : ""}`}
                          />
                        )}
                        <span className="text-lg leading-snug">
                          <span className={item.alert ? "font-semibold text-red-700" : "font-semibold"}>
                            {item.text}
                          </span>
                          {item.detail && (
                            <span className="text-gray-600"> · {item.detail}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-gray-950/10 pt-6">
          <h3 className="text-sm font-bold uppercase tracking-wide">Get them talking</h3>
          <ul className="mt-3 space-y-3">
            {starters.map(line => (
              <li key={line} className="text-lg leading-snug">
                &ldquo;{line}&rdquo;
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto space-y-3">
          <a
            href={`tel:${lead.phone}`}
            onClick={onDialed}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-6 text-lg font-semibold text-white hover:bg-gray-800"
          >
            <FaPhone aria-hidden="true" className="size-4" />
            Call {lead.firstName}
          </a>
          <div className="flex gap-3">
            <a
              href={`sms:${lead.phone}`}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl font-semibold ring-1 ring-gray-950/20 hover:bg-gray-950/5"
            >
              <FaMessage aria-hidden="true" className="size-3.5" />
              Text
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl font-semibold ring-1 ring-gray-950/20 hover:bg-gray-950/5"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
