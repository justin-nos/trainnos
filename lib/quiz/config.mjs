// "Find Your Fit" quiz content. The engine (./engine.mjs) reads this; edit
// copy here without touching logic. `wrapped` is the short phrase used on the
// Wrapped slides and summary chips. `icon` is a react-icons/fa6 export name,
// resolved to a component by components/client/quiz/icons.mjs.

export const PROGRAMS = {
  private: {
    id: "private",
    name: "Private Training",
    tagline: "One-on-one. Built entirely around you.",
    price: "from $45 / 30 min",
    href: "https://trainnos.pushpress.com/landing/plans?category=plcat_uq5r4c5f9reo3d",
    cta: "See Private plans",
  },
  semiPrivate: {
    id: "semiPrivate",
    name: "Semi-Private",
    tagline: "Personal coaching with a crew of 2–4.",
    price: "$30 / 30 min per person",
    href: "https://trainnos.pushpress.com/landing/plans?category=plcat_dc689ce0a8fcb5",
    cta: "See Semi-Private plans",
  },
  groupAdult: {
    id: "groupAdult",
    name: "Group Training",
    tagline: "Lighthearted, results-driven, community-first.",
    price: "under $30 / session",
    href: "https://trainnos.pushpress.com/landing/plans?category=plcat_d79da2fd40ff3b",
    cta: "See Group plans",
  },
  groupAthlete: {
    id: "groupAthlete",
    name: "Athlete Group",
    tagline: "Train alongside athletes chasing the next level.",
    price: "under $30 / session",
    href: "https://trainnos.pushpress.com/landing/plans?category=plcat_0e68e0c7b61236",
    cta: "See Athlete plans",
  },
  kids: {
    id: "kids",
    name: "Kids Speed & Agility",
    tagline: "Faster, stronger, more confident — on the field and off.",
    price: "12-week course",
    // href built at runtime with the parent's name (see kidsSmsHref)
    cta: "Text Brannon to reserve a spot",
  },
};

export const BRANNON_SMS = "+12518954302";

const isAdult = a => a.who === "me" || a.who === "friends";
const isAthlete = a => a.who === "teen" || a.who === "kid";

export const QUESTIONS = [
  {
    id: "who",
    prompt: "Who are we training?",
    options: [
      {value: "me", label: "Just me", icon: "FaUser", wrapped: "Solo Mission"},
      {
        value: "friends",
        label: "Me + 1–3 friends",
        icon: "FaUserGroup",
        wrapped: "Squad Goals",
      },
      {
        value: "teen",
        label: "My teen athlete (13–18)",
        icon: "FaPersonRunning",
        wrapped: "Teen Athlete",
      },
      {
        value: "kid",
        label: "My kid (12 & under)",
        icon: "FaChild",
        wrapped: "Young Athlete",
      },
    ],
  },
  {
    id: "goal",
    prompt: "What's the main goal?",
    showIf: isAdult,
    options: [
      {
        value: "strength",
        label: "Get stronger",
        icon: "FaDumbbell",
        wrapped: "Get Stronger",
      },
      {
        value: "weight",
        label: "Lose weight",
        icon: "FaFire",
        wrapped: "Lose Weight",
      },
      {
        value: "pain",
        label: "Move without pain",
        icon: "FaSpa",
        wrapped: "Move Pain-Free",
      },
      {
        value: "performance",
        label: "Sport performance",
        icon: "FaTrophy",
        wrapped: "Peak Performance",
      },
      {
        value: "habit",
        label: "Build a habit that sticks",
        icon: "FaRepeat",
        wrapped: "Build the Habit",
      },
    ],
  },
  {
    id: "sport",
    prompt: "What's their sport?",
    showIf: isAthlete,
    options: [
      {
        value: "football",
        label: "Football",
        icon: "FaFootball",
        wrapped: "Football",
      },
      {
        value: "baseball",
        label: "Baseball/Softball",
        icon: "FaBaseball",
        wrapped: "Baseball/Softball",
      },
      {value: "soccer", label: "Soccer", icon: "FaFutbol", wrapped: "Soccer"},
      {
        value: "basketball",
        label: "Basketball",
        icon: "FaBasketball",
        wrapped: "Basketball",
      },
      {
        value: "volleyball",
        label: "Volleyball",
        icon: "FaVolleyball",
        wrapped: "Volleyball",
      },
      {
        value: "other",
        label: "Other / multi-sport",
        icon: "FaMedal",
        wrapped: "Multi-Sport",
      },
    ],
  },
  {
    id: "athleteGoal",
    prompt: "What do they want most?",
    showIf: isAthlete,
    options: [
      {
        value: "speed",
        label: "Speed & agility",
        icon: "FaBolt",
        wrapped: "Speed & Agility",
      },
      {
        value: "strength",
        label: "Strength & power",
        icon: "FaDumbbell",
        wrapped: "Strength & Power",
      },
      {
        value: "confidence",
        label: "Confidence",
        icon: "FaShieldHalved",
        wrapped: "Confidence",
      },
      {
        value: "recruit",
        label: "Get noticed / next level",
        icon: "FaBullseye",
        wrapped: "Next Level",
      },
    ],
  },
  {
    id: "experience",
    prompt: "Where are you starting?",
    showIf: isAdult,
    options: [
      {
        value: "new",
        label: "Brand new",
        icon: "FaSeedling",
        wrapped: "Fresh Start",
      },
      {
        value: "returning",
        label: "Getting back into it",
        icon: "FaRotateRight",
        wrapped: "Comeback Season",
      },
      {
        value: "active",
        label: "Already training",
        icon: "FaRocket",
        wrapped: "Already Rolling",
      },
    ],
  },
  {
    id: "style",
    prompt: "How do you like to train?",
    showIf: a => a.who === "me" || a.who === "teen",
    // A parent answers for teens and kids (see engine.mjs withAthleteCopy).
    athleteCopy: {
      prompt: "How do they like to train?",
      labels: {solo: "Just them + a coach"},
    },
    options: [
      {
        value: "solo",
        label: "Just me + a coach",
        icon: "FaUser",
        wrapped: "One-on-One",
      },
      {
        value: "crew",
        label: "Small crew",
        icon: "FaUserGroup",
        wrapped: "Small Crew",
      },
      {
        value: "group",
        label: "Big group energy",
        icon: "FaUsers",
        wrapped: "Big Group Energy",
      },
    ],
  },
  {
    id: "injuries",
    prompt: "Any injuries or limitations we should know about?",
    showIf: isAdult,
    options: [
      {value: "yes", label: "Yes", icon: "FaBandage", wrapped: "Injury-Aware"},
      {value: "no", label: "No", icon: "FaCircleCheck", wrapped: "Good to Go"},
    ],
  },
  {
    id: "days",
    prompt: "How many days a week?",
    showIf: a => a.who !== "kid",
    options: [
      {
        value: "1-2",
        label: "1–2",
        icon: "FaCalendarDays",
        wrapped: "1–2 days/week",
      },
      {value: "3", label: "3", icon: "FaCalendarDays", wrapped: "3 days/week"},
      {
        value: "4+",
        label: "4+",
        icon: "FaCalendarDays",
        wrapped: "4+ days/week",
      },
    ],
  },
  {
    id: "time",
    prompt: "When works best?",
    showIf: a => a.who !== "kid",
    options: [
      {
        value: "early",
        label: "Early bird",
        icon: "FaMugHot",
        wrapped: "Early Bird",
      },
      {
        value: "midday",
        label: "Midday",
        icon: "FaSun",
        wrapped: "Midday Mover",
      },
      {
        value: "evening",
        label: "After work/school",
        icon: "FaMoon",
        wrapped: "After Hours",
      },
    ],
  },
  {
    id: "budget",
    prompt: "Comfortable spend per session?",
    showIf: a => a.who !== "kid",
    options: [
      {
        value: "under30",
        label: "Under $30",
        icon: "FaMoneyBill1Wave",
        wrapped: "Under $30",
      },
      {
        value: "30to50",
        label: "$30–$50",
        icon: "FaMoneyBill1Wave",
        wrapped: "$30–$50",
      },
      {
        value: "50plus",
        label: "$50+",
        icon: "FaMoneyBill1Wave",
        wrapped: "$50+",
      },
    ],
  },
  {
    id: "firstName",
    prompt: "Last one — what should we call you?",
    type: "text",
    maxLength: 50,
  },
];
