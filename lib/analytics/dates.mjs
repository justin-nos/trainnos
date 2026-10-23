// Day bucketing in the gym's time zone. Day keys are "YYYY-MM-DD" strings.
import {MAX_RANGE_DAYS, TIME_ZONE} from "./config.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

export function dayKey(ms) {
  return dayFormat.format(new Date(ms));
}

const toUTC = day => Date.parse(`${day}T00:00:00Z`);
const fromUTC = ms => new Date(ms).toISOString().slice(0, 10);

export function addDays(day, n) {
  return fromUTC(toUTC(day) + n * DAY_MS);
}

export function isDayKey(value) {
  if (typeof value !== "string" || !DAY_KEY.test(value)) return false;
  const ms = toUTC(value);
  return Number.isFinite(ms) && fromUTC(ms) === value;
}

// Inclusive list of day keys.
export function dayRange(from, to) {
  const days = [];
  for (let t = toUTC(from); t <= toUTC(to); t += DAY_MS) days.push(fromUTC(t));
  return days;
}

// The same-length range immediately before.
export function previousRange(from, to) {
  const length = dayRange(from, to).length;
  const prevTo = addDays(from, -1);
  return {from: addDays(prevTo, -(length - 1)), to: prevTo};
}

// Offset of Chicago wall-clock time from UTC at an instant, in ms.
function zoneOffset(ms) {
  const p = Object.fromEntries(
    partsFormat
      .formatToParts(new Date(ms))
      .map(({type, value}) => [type, value]),
  );
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(ms / 1000) * 1000;
}

// UTC ms of local midnight that starts the given day.
export function dayStart(day) {
  const guess = toUTC(day);
  let ms = guess - zoneOffset(guess);
  ms = guess - zoneOffset(ms);
  return ms;
}

// Validates ?from=&to= (both or neither); defaults to the last 30 days.
export function parseRange(searchParams, now = Date.now()) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from && !to) {
    const today = dayKey(now);
    return {ok: true, from: addDays(today, -29), to: today};
  }
  if (!isDayKey(from) || !isDayKey(to)) {
    return {ok: false, error: "from and to must both be YYYY-MM-DD dates"};
  }
  if (from > to) return {ok: false, error: "from must be on or before to"};
  const earliest = addDays(to, -(MAX_RANGE_DAYS - 1));
  return {ok: true, from: from < earliest ? earliest : from, to};
}

// Timestamps more than 24h off the server clock are replaced with now.
export function clampTs(ts, now) {
  if (typeof ts !== "number" || !Number.isFinite(ts)) return now;
  return Math.abs(ts - now) > DAY_MS ? now : Math.round(ts);
}
