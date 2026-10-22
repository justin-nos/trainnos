// Pure quiz logic shared by the browser (FitQuiz) and the API (submitLead).
import {BRANNON_SMS, PROGRAMS, QUESTIONS} from "./config.mjs";

const QUESTIONS_BY_ID = new Map(QUESTIONS.map(q => [q.id, q]));

const isVisible = (q, answers) => !q.showIf || q.showIf(answers);
const isAnswered = (answers, id) =>
  answers[id] !== undefined && answers[id] !== null && answers[id] !== "";
// Teens and kids are signed up by a parent, so copy talks about "them".
const isAthleteBranch = a => a.who === "teen" || a.who === "kid";

function withAthleteCopy(q, answers) {
  if (!q.athleteCopy || !isAthleteBranch(answers)) return q;
  const {prompt = q.prompt, labels = {}} = q.athleteCopy;
  return {
    ...q,
    prompt,
    options: q.options.map(o =>
      labels[o.value] ? {...o, label: labels[o.value]} : o,
    ),
  };
}

export function visibleQuestions(answers) {
  return QUESTIONS.filter(q => isVisible(q, answers));
}

export function nextQuestion(answers) {
  const q = visibleQuestions(answers).find(q => !isAnswered(answers, q.id));
  return q ? withAthleteCopy(q, answers) : null;
}

export function progress(answers) {
  const visible = visibleQuestions(answers);
  return {
    answered: visible.filter(q => isAnswered(answers, q.id)).length,
    total: visible.length,
  };
}

// Visibility only depends on earlier answers, so walking in order is enough.
export function pruneAnswers(answers) {
  const pruned = {};
  for (const q of QUESTIONS) {
    if (isVisible(q, pruned) && isAnswered(answers, q.id)) {
      pruned[q.id] = answers[q.id];
    }
  }
  return pruned;
}

export function sanitizeAnswers(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {ok: false, error: "Answers must be an object"};
  }
  for (const key of Object.keys(raw)) {
    if (!QUESTIONS_BY_ID.has(key)) {
      return {ok: false, error: `Unknown question: ${key}`};
    }
  }

  const answers = {};
  for (const q of QUESTIONS) {
    // Answers to hidden questions are dropped, not rejected.
    if (!isVisible(q, answers)) continue;
    const value = raw[q.id];
    if (!isAnswered(raw, q.id)) {
      return {ok: false, error: `Missing answer: ${q.id}`};
    }
    if (typeof value !== "string") {
      return {ok: false, error: `Invalid answer: ${q.id}`};
    }
    if (q.type === "text") {
      const text = value.trim();
      if (!text || text.length > q.maxLength) {
        return {
          ok: false,
          error: `${q.id} must be 1–${q.maxLength} characters`,
        };
      }
      answers[q.id] = text;
    } else {
      if (!q.options.some(o => o.value === value)) {
        return {ok: false, error: `Invalid answer: ${q.id}`};
      }
      answers[q.id] = value;
    }
  }
  return {ok: true, answers};
}

// The option object chosen for a question, or undefined.
export function selectedOption(answers, id) {
  return QUESTIONS_BY_ID.get(id)?.options?.find(o => o.value === answers[id]);
}

function pickPrograms(a) {
  const needsCare =
    a.style === "solo" || a.injuries === "yes" || a.goal === "pain";
  const affordsMore = a.budget !== "under30";

  if (a.who === "kid") return ["kids", null];
  if (a.who === "teen") {
    if (a.style === "solo" && affordsMore) return ["private", "groupAthlete"];
    return ["groupAthlete", a.budget === "50plus" ? "private" : null];
  }
  if (a.who === "friends") return ["semiPrivate", "groupAdult"];
  if (needsCare && a.budget === "50plus") return ["private", "semiPrivate"];
  if (needsCare && a.budget === "30to50") return ["semiPrivate", "private"];
  if (a.style === "crew" && affordsMore) return ["semiPrivate", "groupAdult"];
  return ["groupAdult", affordsMore ? "semiPrivate" : null];
}

// Per-session budgets each program fits, using the pricing page's numbers.
const BUDGET_FITS = {
  private: ["30to50", "50plus"],
  semiPrivate: ["30to50", "50plus"],
  groupAdult: ["under30", "30to50", "50plus"],
  groupAthlete: ["under30", "30to50", "50plus"],
};

const FALLBACK_REASONS = {
  private: [
    "Every session programmed just for you",
    "A coach fully in your corner",
  ],
  semiPrivate: [
    "Personal coaching at a shared price",
    "Custom workouts for 2–4 people",
  ],
  groupAdult: [
    "A community that keeps you coming back",
    "Practical, results-based training",
  ],
  groupAthlete: [
    "Sport-specific speed and strength work",
    "Train alongside athletes chasing the next level",
  ],
  kids: [
    "A 12-week course with a clear finish line",
    "Built for athletes 12 & under",
  ],
};

const ATHLETE_FALLBACK_REASONS = {
  ...FALLBACK_REASONS,
  private: [
    "Every session programmed around your athlete",
    "A coach fully in their corner",
  ],
};

function buildReasons(a, primary) {
  const personal = [];
  const isGroup = primary === "groupAdult" || primary === "groupAthlete";
  const athlete = isAthleteBranch(a);

  if (primary === "kids") {
    const goal = selectedOption(a, "athleteGoal");
    if (goal) personal.push(`Focused on ${goal.wrapped.toLowerCase()}`);
  }
  if (a.style === "solo" && primary === "private") {
    personal.push(
      athlete
        ? "One-on-one attention for your athlete"
        : "You want one-on-one attention",
    );
  }
  if (a.style === "crew" && primary === "semiPrivate") {
    personal.push("You like training with a small crew");
  }
  if (a.who === "friends")
    personal.push("Bring 1–3 friends and train together");
  if (a.style === "group" && isGroup) {
    personal.push(
      athlete
        ? "They feed off big group energy"
        : "You feed off big group energy",
    );
  }
  if (a.injuries === "yes") {
    personal.push(
      isGroup
        ? "Injury-sensitive coaching, even in a group"
        : "Built around old injuries",
    );
  }
  if (a.goal === "pain" && !isGroup) {
    personal.push("Coaching that helps you move without pain");
  }
  if (a.experience === "new") personal.push("A great place to start from zero");
  if (a.experience === "returning") {
    personal.push("Ease back in with a coach in your corner");
  }

  const budget = selectedOption(a, "budget");
  if (budget && BUDGET_FITS[primary]?.includes(a.budget)) {
    personal.splice(1, 0, `Fits your ${budget.wrapped} per-session budget`);
  }

  const fallback = (athlete ? ATHLETE_FALLBACK_REASONS : FALLBACK_REASONS)[
    primary
  ];
  const reasons = [...new Set([...personal, ...fallback])];
  return reasons.slice(0, 3);
}

export function recommend(answers) {
  const [primary, alternate] = pickPrograms(answers);
  return {primary, alternate, reasons: buildReasons(answers, primary)};
}

const RHYTHM_SUBS = {
  "1-2": "Every rep counts.",
  3: "The sweet spot.",
  "4+": "No off season. Literally.",
};

export function wrappedSlides(answers, rec) {
  const athlete = isAthleteBranch(answers);
  const their = athlete ? "Their" : "Your";
  const slides = [
    {
      id: "intro",
      kicker: "Your fit, wrapped",
      headline: athlete
        ? `${answers.firstName}, let's see what your athlete is made of.`
        : `${answers.firstName}, let's see what you're made of.`,
      icon: "FaFire",
      sub: `Here's what your answers say about ${athlete ? "them" : "you"}.`,
      theme: "intro",
    },
  ];

  const goal =
    selectedOption(answers, "goal") ?? selectedOption(answers, "athleteGoal");
  if (goal) {
    slides.push({
      id: "goal",
      kicker: `${their} #1 goal`,
      headline: goal.wrapped,
      icon: goal.icon,
      sub: "Love that. Let's make it happen.",
      theme: "goal",
    });
  }

  if (answers.who === "kid") {
    const sport = selectedOption(answers, "sport");
    if (sport) {
      slides.push({
        id: "sport",
        kicker: `${their} sport`,
        headline: `Built for the field · ${sport.wrapped}`,
        icon: sport.icon,
        sub: "Speed and confidence that carry over to game day.",
        theme: "rhythm",
      });
    }
  } else {
    const days = selectedOption(answers, "days");
    const time = selectedOption(answers, "time");
    if (days && time) {
      slides.push({
        id: "rhythm",
        kicker: `${their} rhythm`,
        headline: `${days.label} days a week · ${time.wrapped}`,
        icon: time.icon,
        sub: RHYTHM_SUBS[answers.days],
        theme: "rhythm",
      });
    }
  }

  const vibe =
    selectedOption(answers, "experience") ?? selectedOption(answers, "style");
  if (vibe) {
    slides.push({
      id: "vibe",
      kicker: `${their} vibe`,
      headline: vibe.wrapped,
      icon: vibe.icon,
      sub: `That tells us a lot about how to coach ${athlete ? "them" : "you"}.`,
      theme: "vibe",
    });
  }

  const program = PROGRAMS[rec.primary];
  slides.push({
    id: "match",
    kicker: `${their} match`,
    headline: program.name,
    icon: "FaHandshake",
    sub: program.tagline,
    theme: "match",
  });
  return slides;
}

export function kidsSmsHref(firstName) {
  const body = `Hey Brannon, this is ${firstName}. I'm interested in reserving a spot in the Kids Speed & Agility course.`;
  return `sms:${BRANNON_SMS}?body=${encodeURIComponent(body)}`;
}
