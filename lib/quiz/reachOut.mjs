// The admin Reach Out sheet, built from a stored lead: the answers that
// matter most under Who? / Why? / When? / What Else?, plus easy openers.
import {FALLBACK_STARTER, PROGRAMS, STARTER_ORDER, STARTERS} from "./config.mjs";
import {recommend, selectedOption} from "./engine.mjs";

const isAthlete = a => a.who === "teen" || a.who === "kid";

// Who the coach is calling, in their words. Teen and kid leads are parents.
const WHO = {
  me: "Training on their own",
  friends: "Coming with 1–3 friends",
  teen: "Parent of a teen athlete (13–18)",
  kid: "Parent of a kid (12 & under)",
};

export function conversationStarters(answers) {
  const order = STARTER_ORDER[isAthlete(answers) ? "athlete" : "self"];
  const picked = order.map(id => STARTERS[id]?.[answers[id]]).filter(Boolean);
  return [...new Set([...picked, FALLBACK_STARTER])].slice(0, 3);
}

// {sections: [{id, title, items: [{icon, text, detail?, alert?}]}], starters}
// Items are in priority order; the first one is the answer to lead with.
export function reachOutBrief(lead) {
  const answers = lead.answers ?? {};
  const athlete = isAthlete(answers);
  const option = id => selectedOption(answers, id);
  const who = option("who");
  const goal = option(athlete ? "athleteGoal" : "goal");
  const experience = option("experience");
  const days = option("days");
  const time = option("time");
  const style = option("style");
  const budget = option("budget");
  const rec = lead.recommendation?.primary ? lead.recommendation : recommend(answers);
  const program = PROGRAMS[rec.primary];
  const alternate = PROGRAMS[rec.alternate];

  const when = [days && `${days.label} days a week`, time?.label].filter(Boolean).join(" · ");

  return {
    sections: [
      {
        id: "who",
        title: "Who?",
        items: [
          {
            icon: who?.icon ?? "FaUser",
            text: WHO[answers.who] ?? "—",
            detail: athlete ? option("sport")?.label : null,
          },
        ],
      },
      {
        id: "why",
        title: "Why?",
        items: [
          {
            icon: goal?.icon ?? "FaFire",
            text: goal?.label ?? "Didn't say",
            detail: athlete ? null : experience?.label,
          },
        ],
      },
      {
        id: "when",
        title: "When?",
        items: [{icon: time?.icon ?? "FaCalendarDays", text: when || "Ask what works for them"}],
      },
      {
        id: "else",
        title: "What Else?",
        items: [
          answers.injuries === "yes" && {
            icon: "FaBandage",
            text: "Mentioned an injury, ask gently",
            alert: true,
          },
          program && {
            icon: "FaHandshake",
            text: `Best fit: ${program.name}`,
            detail: alternate ? `or ${alternate.name}` : null,
          },
          budget && {icon: budget.icon, text: `Budget: ${budget.label} a session`},
          style && {icon: style.icon, text: `Likes: ${style.label}`},
        ].filter(Boolean),
      },
    ],
    starters: conversationStarters(answers),
  };
}
