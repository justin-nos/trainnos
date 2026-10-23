// Traffic source, device and bot classification.
import {PUSHPRESS_HOST} from "./config.mjs";

const clean = (value, max = 40) => {
  if (typeof value !== "string") return null;
  const s = value.trim().toLowerCase().slice(0, max);
  return s || null;
};

// [host pattern, source, medium]; first match wins.
const REFERRERS = [
  [/(^|\.)google\.[a-z.]+$/, "google", "organic"],
  [/(^|\.)bing\.com$/, "bing", "organic"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo", "organic"],
  [/(^|\.)yahoo\.com$/, "yahoo", "organic"],
  [/(^|\.)facebook\.com$|^fb\.me$/, "facebook", "social"],
  [/(^|\.)instagram\.com$/, "instagram", "social"],
  [/(^|\.)chatgpt\.com$/, "chatgpt", "ai"],
  [/(^|\.)perplexity\.ai$/, "perplexity", "ai"],
  [
    new RegExp(`^${PUSHPRESS_HOST.replace(/\./g, "\\.")}$`),
    "pushpress",
    "referral",
  ],
];

function referrerHost(referrer) {
  if (typeof referrer !== "string" || !referrer) return null;
  try {
    return new URL(referrer).host.toLowerCase() || null;
  } catch {
    return null;
  }
}

// utm: plain object of query params (utm_source, utm_medium, utm_campaign).
export function classifySource({utm = {}, referrer = "", selfHosts = []} = {}) {
  const campaign = clean(utm.utm_campaign);
  const host = referrerHost(referrer);
  const utmSource = clean(utm.utm_source);
  if (utmSource) {
    return {
      source: utmSource,
      medium: clean(utm.utm_medium) ?? "campaign",
      campaign,
      referrerHost: host,
    };
  }

  const self = selfHosts.map(h => h.toLowerCase());
  if (!host || self.includes(host)) {
    return {source: "direct", medium: "none", campaign, referrerHost: null};
  }
  const hostname = host.replace(/:\d+$/, "");
  for (const [pattern, source, medium] of REFERRERS) {
    if (pattern.test(hostname))
      return {source, medium, campaign, referrerHost: host};
  }
  return {
    source: clean(hostname.replace(/^www\./, "")),
    medium: "referral",
    campaign,
    referrerHost: host,
  };
}

// Kind of a clicked link, from its resolved href.
export function clickKind(href, selfHost) {
  if (typeof href !== "string" || !href) return "internal";
  const scheme = href.match(/^(sms|tel|mailto):/i)?.[1];
  if (scheme) return scheme.toLowerCase();
  try {
    const url = new URL(href, `https://${selfHost}`);
    if (url.host === PUSHPRESS_HOST) return "pushpress";
    if (!/^https?:$/.test(url.protocol)) return "internal";
    return url.host === selfHost ? "internal" : "outbound";
  } catch {
    return "internal";
  }
}

// Strips query strings and hashes, which can carry PII (the kids SMS body has
// the visitor's name). PushPress keeps ?category= so plan links stay distinct.
export function sanitizeHref(href) {
  if (typeof href !== "string" || !href.trim()) return null;
  const raw = href.trim();
  const scheme = raw.match(/^(sms|tel|mailto):/i)?.[1];
  if (scheme) {
    const target = raw.slice(scheme.length + 1).split(/[?#]/)[0];
    return `${scheme.toLowerCase()}:${target}`.slice(0, 200);
  }
  let url;
  try {
    url = new URL(raw, "https://trainnos.com");
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;
  const absolute = /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//");
  let out = absolute ? `${url.origin}${url.pathname}` : url.pathname;
  const category = url.searchParams.get("category");
  if (url.host === PUSHPRESS_HOST && category) {
    out += `?category=${encodeURIComponent(category)}`;
  }
  return out.slice(0, 200);
}

export function deviceFromUA(ua = "") {
  if (/ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i.test(ua))
    return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua))
    return "mobile";
  return "desktop";
}

const BOT_UA =
  /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|vercel-screenshot|pingdom|uptime/i;

export function isBot(ua) {
  return !ua || BOT_UA.test(ua);
}
