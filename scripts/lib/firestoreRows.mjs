// Firestore docs -> rows for public.import_firestore (supabase/migrations/
// *_import_firestore.sql). Docs are {id, data, createTime?}; Timestamps are
// anything with toDate().
const DAY_MS = 24 * 60 * 60 * 1000;
// Fallbacks for docs written before expireAt existed (lib/analytics/config.mjs).
const RAW_RETENTION_DAYS = 90;
const SESSION_RETENTION_DAYS = 395;

export const toIso = value => {
  if (value == null) return null;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number" || typeof value === "string") {
    return new Date(value).toISOString();
  }
  return null;
};

const plusDays = (iso, days) =>
  iso ? new Date(Date.parse(iso) + days * DAY_MS).toISOString() : null;

export function leadRow({id, data}) {
  return {
    id,
    first_name: data.firstName,
    phone: data.phone,
    consent: data.consent,
    answers: data.answers,
    recommendation: data.recommendation,
    status: data.status ?? "new",
    source: data.source,
    attribution: data.attribution ?? {},
    created_at: toIso(data.createdAt),
    updated_at: toIso(data.updatedAt),
  };
}

// Testimonial docs have no createdAt; the doc's createTime keeps their order.
export function testimonialRow({id, data, createTime}, imagePath) {
  return {
    id,
    first_name: data.firstName ?? null,
    last_name: data.lastName ?? null,
    title: data.title ?? null,
    text: data.text ?? null,
    image_path: imagePath ?? null,
    created_at: toIso(createTime),
  };
}

export const emailRow = ({id, data}) => ({
  email: data.email ?? id,
  name: data.name ?? null,
});

export function sessionRow({id, data}) {
  const startedAt = toIso(data.startedAt);
  const lastSeenAt = toIso(data.lastSeenAt);
  return {
    id,
    vid: data.vid ?? null,
    started_at: startedAt,
    last_seen_at: lastSeenAt,
    source: data.source ?? null,
    medium: data.medium ?? null,
    campaign: data.campaign ?? null,
    landing: data.landing ?? null,
    referrer_host: data.referrerHost ?? null,
    device: data.device ?? null,
    geo: data.geo ?? null,
    pageviews: data.pageviews ?? 0,
    engaged_ms: data.engagedMs ?? 0,
    paths: data.paths ?? [],
    reached: data.reached ?? {},
    primary: data.primary ?? null,
    lead_id: data.leadId ?? null,
    expire_at:
      toIso(data.expireAt) ??
      plusDays(startedAt ?? lastSeenAt ?? new Date().toISOString(), SESSION_RETENTION_DAYS),
  };
}

// createdAt is dropped (created_at defaults to the import time).
export function eventRow({data}) {
  const ts = toIso(data.ts);
  return {
    name: data.name,
    path: data.path ?? null,
    props: data.props ?? {},
    ts,
    vid: data.vid ?? null,
    sid: data.sid ?? null,
    expire_at: toIso(data.expireAt) ?? plusDays(ts, RAW_RETENTION_DAYS),
  };
}

// {"2026-10-28": tree, ...} without the doc's date/updatedAt bookkeeping.
export function dailyMap(docs) {
  return Object.fromEntries(
    docs.map(({id, data}) => {
      const {date, updatedAt, ...tree} = data;
      return [id, tree];
    }),
  );
}

export function buildPayload({leads, testimonials, emails, sessions, events, daily, imagePaths = {}}) {
  return {
    leads: leads.map(leadRow),
    testimonials: testimonials.map(doc => testimonialRow(doc, imagePaths[doc.id])),
    email_signups: emails.map(emailRow),
    sessions: sessions.map(sessionRow),
    events: events.map(eventRow),
    daily: dailyMap(daily),
  };
}

export const payloadCounts = p => ({
  leads: p.leads.length,
  testimonials: p.testimonials.length,
  testimonialImages: p.testimonials.filter(t => t.image_path).length,
  emails: p.email_signups.length,
  sessions: p.sessions.length,
  events: p.events.length,
  daily: Object.keys(p.daily).length,
});
