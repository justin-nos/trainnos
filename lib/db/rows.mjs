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
    contactedBy: row.contacted_by ?? null,
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

// urlFor turns a Storage path into a public URL (publicUrl from
// lib/media/storage.js); passed in so this module stays pure.
export function trainerFromRow(row, urlFor) {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    bio: row.bio ?? "",
    photo: {path: row.photo_path, url: urlFor(row.photo_path)},
    email: row.email ?? null,
    phone: row.phone ?? null,
    active: row.active,
    sortOrder: row.sort_order,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    removedAt: iso(row.removed_at),
  };
}

const TRAINER_COLUMNS = {
  name: "name",
  position: "position",
  bio: "bio",
  email: "email",
  phone: "phone",
  photoPath: "photo_path",
  active: "active",
  sortOrder: "sort_order",
  removedAt: "removed_at",
};

// Only the keys present, so PATCH can send a partial update.
export function trainerToRow(trainer) {
  const row = {};
  for (const [key, column] of Object.entries(TRAINER_COLUMNS)) {
    if (trainer[key] !== undefined) row[column] = trainer[key];
  }
  return row;
}

export function postFromRow(row, urlFor) {
  return {
    id: row.id,
    type: row.type,
    media: {
      path: row.media_path,
      url: urlFor(row.media_path),
      contentType: row.content_type,
      width: row.width,
      height: row.height,
      duration: row.duration ?? null,
    },
    poster: row.poster_path ? {path: row.poster_path, url: urlFor(row.poster_path)} : null,
    caption: row.caption ?? "",
    status: row.status,
    pinned: row.pinned,
    pinnedAt: iso(row.pinned_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    uploadedBy: row.uploaded_by ?? null,
  };
}

// A validated post (lib/community/schema.mjs) plus what finalizeUpload found.
export function postToRow({post, contentType, uploadedBy}) {
  return {
    id: post.id,
    type: post.type,
    media_path: post.mediaPath,
    content_type: contentType,
    width: post.width,
    height: post.height,
    duration: post.duration,
    poster_path: post.posterPath,
    caption: post.caption,
    uploaded_by: uploadedBy,
  };
}
