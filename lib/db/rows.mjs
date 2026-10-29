// Postgres rows <-> the JSON shapes the API routes returned under Firestore.
const iso = value => (value ? new Date(value).toISOString() : null);

export function leadFromRow(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    phone: row.phone,
    consent: row.consent,
    answers: row.answers,
    recommendation: row.recommendation,
    status: row.status,
    source: row.source,
    attribution: row.attribution,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function leadToRow(lead) {
  return {
    first_name: lead.firstName,
    phone: lead.phone,
    consent: lead.consent,
    answers: lead.answers,
    recommendation: lead.recommendation,
    status: lead.status,
    source: lead.source,
    attribution: lead.attribution,
  };
}

export function sessionFromRow(row) {
  return {
    id: row.id,
    startedAt: iso(row.started_at),
    lastSeenAt: iso(row.last_seen_at),
    landing: row.landing ?? null,
    source: row.source ?? null,
    medium: row.medium ?? null,
    campaign: row.campaign ?? null,
    device: row.device ?? null,
    geo: row.geo ?? null,
    pageviews: row.pageviews ?? 0,
    engagedMs: Number(row.engaged_ms ?? 0),
    paths: row.paths ?? [],
    reached: row.reached ?? {},
    primary: row.primary ?? null,
  };
}

// What summarize() received from a Firestore daily doc.
export const dailyFromRow = ({day, data}) => ({date: day, ...data});
