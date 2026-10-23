// Browser-only analytics tracker: a module singleton, no React. Records page
// views, clicks, scroll depth, engaged time, time on [data-section] blocks and
// hovers on [data-track] CTAs, and sends them in batches to /api/track.
// No cookies; only random ids in localStorage.
import {
  HOVER_MIN_MS,
  MAX_EVENTS_PER_BATCH,
  SECTION_ID,
  SECTION_VISIBLE_RATIO,
  SESSION_IDLE_MS,
} from "./config.mjs";
import {dayKey} from "./dates.mjs";
import {normalizePath} from "./keys.mjs";
import {classifySource, clickKind, sanitizeHref} from "./source.mjs";

const ENDPOINT = "/api/track";
const DEV = process.env.NODE_ENV !== "production";
const VID_KEY = "nos_vid";
const SESSION_KEY = "nos_session";
const OPTOUT_KEY = "nos_analytics_optout";
const FLUSH_MS = 5000;
const FLUSH_AT = 10;
const MAX_MS = 1_800_000;
const SCROLL_DEPTHS = [25, 50, 75, 100];

let initialized = false;
let queue = []; // {sid, context, event}
let flushTimer = null;
let page = null; // the current page view's state
let tabVisible = true;
let hover = null; // {el, id, kind, since, clicked}
let sectionObserver = null;
const memory = {}; // fallback when localStorage is unavailable

// ---- storage ----

function read(key) {
  try {
    return localStorage.getItem(key) ?? memory[key] ?? null;
  } catch {
    return memory[key] ?? null;
  }
}

function write(key, value) {
  memory[key] = value;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the in-memory copy is enough.
  }
}

function readJSON(key) {
  try {
    return JSON.parse(read(key));
  } catch {
    return null;
  }
}

// crypto.randomUUID needs a secure context, which LAN dev (http://10.x) isn't.
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// ---- ids and sessions ----

const optedOut = () => read(OPTOUT_KEY) === "1";

function applyOptOut() {
  const param = new URLSearchParams(location.search).get("nos_optout");
  if (param === "1" || location.pathname.startsWith("/admins")) {
    write(OPTOUT_KEY, "1");
  } else if (param === "0") {
    write(OPTOUT_KEY, "0");
  }
  if (optedOut()) queue = [];
}

function visitorId() {
  let vid = read(VID_KEY);
  if (!vid) {
    vid = uuid();
    write(VID_KEY, vid);
  }
  return vid;
}

const utmParams = () =>
  Object.fromEntries(
    [...new URLSearchParams(location.search)].filter(([k]) =>
      k.startsWith("utm_"),
    ),
  );

// Starts a new session after 30 idle minutes or on a new utm_campaign.
function startPageSession(now) {
  const stored = readJSON(SESSION_KEY);
  const utm = utmParams();
  const campaign = utm.utm_campaign?.trim().toLowerCase().slice(0, 40);
  const expired = !stored?.sid || now - stored.lastActivity > SESSION_IDLE_MS;
  const newCampaign = campaign && campaign !== stored?.context?.campaign;
  const today = dayKey(now);

  const started = expired || Boolean(newCampaign);
  const session = started
    ? {
        sid: uuid(),
        context: {
          ...classifySource({
            utm,
            referrer: document.referrer,
            selfHosts: [location.host],
          }),
          landing: normalizePath(location.pathname) ?? "other",
        },
      }
    : stored;
  const firstOfDay = stored?.day !== today;
  write(
    SESSION_KEY,
    JSON.stringify({...session, lastActivity: now, day: today}),
  );
  return {session, started, firstOfDay};
}

function touchSession() {
  const stored = readJSON(SESSION_KEY);
  if (stored?.sid) {
    write(SESSION_KEY, JSON.stringify({...stored, lastActivity: Date.now()}));
  }
}

// ---- queue and transport ----

function send(body) {
  const json = JSON.stringify(body);
  try {
    const blob = new Blob([json], {type: "application/json"});
    if (navigator.sendBeacon?.(ENDPOINT, blob)) return;
  } catch {
    // Fall through to fetch.
  }
  fetch(ENDPOINT, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: json,
    keepalive: true,
  }).catch(() => {});
}

function flush() {
  clearTimeout(flushTimer);
  flushTimer = null;
  if (!queue.length || optedOut()) {
    queue = [];
    return;
  }
  const vid = visitorId();
  const bySid = new Map();
  for (const item of queue) {
    if (!bySid.has(item.sid))
      bySid.set(item.sid, {context: item.context, events: []});
    bySid.get(item.sid).events.push(item.event);
  }
  queue = [];
  for (const [sid, {context, events}] of bySid) {
    for (let i = 0; i < events.length; i += MAX_EVENTS_PER_BATCH) {
      send({
        v: 1,
        vid,
        sid,
        session: context,
        events: events.slice(i, i + MAX_EVENTS_PER_BATCH),
      });
    }
  }
}

function enqueue(name, props = {}) {
  if (!page || optedOut()) return;
  const event = {name, ts: Date.now(), path: page.path, props};
  queue.push({sid: page.sid, context: page.context, event});
  touchSession();
  if (DEV) console.debug("[analytics]", name, props);
  if (queue.length >= FLUSH_AT) flush();
  else flushTimer ??= setTimeout(flush, FLUSH_MS);
}

// ---- engaged time and sections ----

// Moves visible time into the page and section counters.
function accrue() {
  if (!page) return;
  const now = performance.now();
  if (page.visibleSince !== null) page.engagedMs += now - page.visibleSince;
  page.visibleSince = tabVisible ? now : null;
  for (const s of page.sections.values()) {
    if (s.since !== null) s.ms += now - s.since;
    s.since = tabVisible && s.inView.size ? now : null;
  }
}

// Reports engaged and section time since the last report.
function reportTime() {
  if (!page) return;
  accrue();
  const ms = Math.min(Math.round(page.engagedMs), MAX_MS);
  if (ms > 0) enqueue("engagement", {ms});
  page.engagedMs = 0;
  for (const [id, s] of page.sections) {
    const sectionMs = Math.min(Math.round(s.ms), MAX_MS);
    const newlySeen = s.seen && !s.seenSent;
    if (!newlySeen && sectionMs < 250) continue;
    enqueue(
      "section",
      newlySeen ? {id, ms: sectionMs, seen: true} : {id, ms: sectionMs},
    );
    s.seenSent ||= s.seen;
    s.ms = 0;
  }
}

function sectionState(id) {
  let s = page.sections.get(id);
  if (!s) {
    s = {ms: 0, since: null, inView: new Set(), seen: false, seenSent: false};
    page.sections.set(id, s);
  }
  return s;
}

// Tall sections never reach the ratio, so filling half the viewport counts too.
function onSectionsIntersect(entries) {
  if (!page) return;
  accrue();
  for (const entry of entries) {
    const id = entry.target.dataset.section;
    if (!SECTION_ID.test(id)) continue;
    const s = sectionState(id);
    const visible =
      entry.isIntersecting &&
      (entry.intersectionRatio >= SECTION_VISIBLE_RATIO ||
        entry.intersectionRect.height >= innerHeight * SECTION_VISIBLE_RATIO);
    if (visible) {
      s.inView.add(entry.target);
      s.seen = true;
    } else {
      s.inView.delete(entry.target);
    }
  }
  accrue();
}

function observeSections() {
  if (!sectionObserver || !page) return;
  for (const el of document.querySelectorAll("[data-section]")) {
    if (page.observed.has(el)) continue;
    page.observed.add(el);
    sectionObserver.observe(el);
  }
}

// ---- scroll ----

let scrollQueued = false;

function checkScroll() {
  scrollQueued = false;
  if (!page) return;
  const height = document.documentElement.scrollHeight;
  const ratio = height ? (scrollY + innerHeight) / height : 1;
  for (const depth of SCROLL_DEPTHS) {
    if (ratio >= depth / 100 - 0.01 && !page.scroll.has(depth)) {
      page.scroll.add(depth);
      enqueue("scroll", {depth});
    }
  }
}

function onScroll() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(checkScroll);
}

// ---- clicks and hovers ----

function describeLink(el) {
  const attr = el.getAttribute("href");
  const href = attr ? el.href || attr : null;
  const text = el.textContent?.replace(/\s+/g, " ").trim().slice(0, 60);
  return {
    id: el.dataset.track || text || sanitizeHref(href) || "unknown",
    kind: href ? clickKind(href, location.host) : "internal",
    href: sanitizeHref(href),
  };
}

function onClick(e) {
  const el = e.target?.closest?.("a[href], [data-track]");
  if (!el) return;
  if (hover?.el === el) hover.clicked = true;
  const {id, kind, href} = describeLink(el);
  enqueue("click", href ? {id, kind, href} : {id, kind});
  // Leaving the site may not fire pagehide in time on every browser.
  if (kind !== "internal") flush();
}

function endHover() {
  if (!hover) return;
  const {id, kind, since, clicked} = hover;
  hover = null;
  if (clicked || !page || page.hovered.has(id)) return;
  if (performance.now() - since < HOVER_MIN_MS) return;
  page.hovered.add(id);
  enqueue("hover", {id, kind});
}

function onPointerOver(e) {
  if (e.pointerType !== "mouse") return;
  const el = e.target?.closest?.("[data-track]");
  if (!el || el === hover?.el) return;
  endHover();
  const {id, kind} = describeLink(el);
  hover = {el, id, kind, since: performance.now(), clicked: false};
}

function onPointerOut(e) {
  if (hover && !hover.el.contains(e.relatedTarget)) endHover();
}

// ---- lifecycle ----

function onVisibilityChange() {
  if (document.visibilityState === "hidden") {
    reportTime();
    tabVisible = false;
    accrue();
    endHover();
    flush();
  } else {
    tabVisible = true;
    accrue();
  }
}

function onPageHide() {
  reportTime();
  endHover();
  flush();
}

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  applyOptOut();
  tabVisible = document.visibilityState === "visible";

  const opts = {capture: true, passive: true};
  document.addEventListener("click", onClick, opts);
  document.addEventListener("pointerover", onPointerOver, opts);
  document.addEventListener("pointerout", onPointerOut, opts);
  addEventListener("scroll", onScroll, {passive: true});
  document.addEventListener("visibilitychange", onVisibilityChange);
  addEventListener("pagehide", onPageHide);

  if ("IntersectionObserver" in window) {
    sectionObserver = new IntersectionObserver(onSectionsIntersect, {
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    });
    // Sections can mount after navigation (client components, the quiz).
    new MutationObserver(observeSections).observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

export function pageview(pathname) {
  if (!initialized || pathname === page?.pathname) return;
  applyOptOut();
  const path = normalizePath(pathname);
  if (optedOut() || !path) {
    page = null;
    return;
  }

  reportTime();
  endHover();
  const now = Date.now();
  const {session, started, firstOfDay} = startPageSession(now);
  sectionObserver?.disconnect();
  page = {
    pathname,
    path,
    sid: session.sid,
    context: session.context,
    engagedMs: 0,
    visibleSince: tabVisible ? performance.now() : null,
    scroll: new Set(),
    sections: new Map(),
    observed: new WeakSet(),
    hovered: new Set(),
  };
  const props = {};
  if (started) props.sessionStart = true;
  if (firstOfDay) props.firstOfDay = true;
  enqueue("pageview", props);
  observeSections();
  requestAnimationFrame(checkScroll);
}

// Custom events (the quiz, form steps). Ignored before the first page view.
export function track(name, props = {}) {
  enqueue(name, props);
}

export function getAnalyticsIds() {
  if (!page || optedOut()) return null;
  return {vid: visitorId(), sid: page.sid};
}
