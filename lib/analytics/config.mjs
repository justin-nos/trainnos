// Shared constants for the in-house analytics pipeline (tracker, API, dashboard).
export const TIME_ZONE = "America/Chicago";
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const MAX_EVENTS_PER_BATCH = 25;
export const MAX_BODY_BYTES = 16 * 1024;
export const RAW_RETENTION_DAYS = 90;
export const SESSION_RETENTION_DAYS = 395;
export const MAX_RANGE_DAYS = 400;
// Normalized paths; anything else is "other". /admins is never tracked.
export const ROUTES = [
  "/",
  "/start",
  "/pricing",
  "/meet",
  "/diet",
  "/whattoexpect",
  "/testimonials",
];
export const ROUTE_PREFIXES = [
  ["/testimonials/create/", "/testimonials/create"],
];
export const CLICK_KINDS = [
  "internal",
  "outbound",
  "pushpress",
  "sms",
  "tel",
  "mailto",
];
export const PUSHPRESS_HOST = "trainnos.pushpress.com";
// A hover on a tagged CTA counts once the pointer rests this long without a click.
export const HOVER_MIN_MS = 500;
// A section counts as seen while at least this share of it is on screen.
export const SECTION_VISIBLE_RATIO = 0.5;
export const SECTION_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
// Form milestones, in order. Values typed into fields are never sent.
export const FORM_STEPS = {
  contact: [
    "phone_typed",
    "phone_valid",
    "consent_checked",
    "submit_attempt",
    "phone_error",
    "submit_error",
  ],
};
export const FUNNELS = {
  quiz: {
    label: "Find Your Fit",
    steps: [
      {key: "visit", label: "Visited site"},
      {key: "start", label: "Opened /start"},
      {key: "quizStarted", label: "Answered first question"},
      {key: "quizCompleted", label: "Finished quiz"},
      {key: "phoneTyped", label: "Started typing phone"},
      {key: "lead", label: "Sent phone number"},
    ],
  },
  pricing: {
    label: "Pricing → PushPress",
    steps: [
      {key: "visit", label: "Visited site"},
      {key: "pricing", label: "Viewed /pricing"},
      {key: "pushpress", label: "Clicked a PushPress plan"},
    ],
  },
};
// Home-view callouts stay quiet below these sample sizes.
export const INSIGHTS = {
  // Fewer sessions in the range: no leak, working or watch callouts.
  minSessions: 50,
  // A funnel step needs this many people to be called the leak.
  minStepCount: 20,
  // Smaller net changes in leads don't get a "mostly from" driver.
  minLeadChange: 2,
  // A source needs this much traffic to be on the watch list...
  watchMinSessions: 50,
  // ...and must convert at or below this share of the site rate.
  watchRateRatio: 0.25,
};
// The quiz funnel rebuilt from daily totals (events, not sessions), for the
// home view. `did` and `missed` complete "Of N who {did}, X% {missed}."
export const TOTALS_FUNNEL = [
  {key: "sessions", label: "Visited site", did: "visited"},
  {
    key: "quizStarted",
    label: "Answered first question",
    did: "started the quiz",
    missed: "never started the quiz",
  },
  {
    key: "quizCompleted",
    label: "Finished quiz",
    did: "finished the quiz",
    missed: "didn't finish it",
  },
  {
    key: "phoneTyped",
    label: "Started typing phone",
    did: "started typing a phone number",
    missed: "never started typing a phone number",
  },
  {key: "lead", label: "Sent phone number", missed: "didn't send it"},
];
