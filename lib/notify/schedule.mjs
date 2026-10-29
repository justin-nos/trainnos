// When lead texts go out, in gym time (Central). Texts are held overnight,
// and one reminder is scheduled for the next morning.
export const TZ = "America/Chicago";
export const QUIET = {start: 21, end: 7}; // 9pm–7am CT
export const REMINDER_HOUR = 9;
export const MIN_SCHEDULE_MS = 15 * 60 * 1000; // Twilio's minimum lead time

const FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

// {year, month, day, hour, minute} of an instant on the Central clock.
function localParts(date) {
  const parts = {};
  for (const {type, value} of FORMAT.formatToParts(date)) {
    if (type !== "literal") parts[type] = Number(value);
  }
  return parts;
}

// The calendar day n days after {year, month, day}.
function addDays({year, month, day}, n) {
  const d = new Date(Date.UTC(year, month - 1, day + n));
  return {year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate()};
}

// The instant when the Central clock reads hour:00 on that day. Central is
// UTC−5 (CDT) or UTC−6 (CST); whichever round-trips is right for the date.
function centralTime({year, month, day}, hour) {
  for (const offset of [5, 6]) {
    const candidate = new Date(Date.UTC(year, month - 1, day, hour + offset));
    const p = localParts(candidate);
    if (p.year === year && p.month === month && p.day === day && p.hour === hour) {
      return candidate;
    }
  }
  throw new Error(`No ${hour}:00 Central on ${year}-${month}-${day}`);
}

// null = send now. Otherwise the Date to send at (next 07:00 CT).
// If 07:00 is under 15 min away, send now (Twilio can't schedule that close).
export function alertSendAt(now) {
  const local = localParts(now);
  if (local.hour >= QUIET.end && local.hour < QUIET.start) return null;
  const day = local.hour >= QUIET.start ? addDays(local, 1) : local;
  const at = centralTime(day, QUIET.end);
  return at - now < MIN_SCHEDULE_MS ? null : at;
}

// 09:00 CT on the calendar day after the alert goes out.
// Mon 15:00 → Tue 09:00. Tue 01:00 (alert held to Tue 07:00) → Wed 09:00.
export function reminderSendAt(now) {
  const alertAt = alertSendAt(now) ?? now;
  return centralTime(addDays(localParts(alertAt), 1), REMINDER_HOUR);
}

const WHEN = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

// "Mon 3:12pm" on the Central clock, for the reminder text.
export function shortCentralTime(date) {
  return WHEN.format(date).replace(/\s?(AM|PM)$/, (_, m) => m.toLowerCase()).replace(",", "");
}
