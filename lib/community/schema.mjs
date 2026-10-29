// Community post rules shared by the admin API and the admin tools.
// supabase/migrations/20261029000002_community.sql enforces the same limits.
import {isUuid} from "../analytics/schema.mjs";
import {MEDIA_RULES} from "../media/rules.mjs";

export const CAPTION_MAX = 200;
export const POST_STATUSES = ["published", "hidden"];
export const POST_TYPES = ["photo", "video"];

const positiveInt = value => Number.isInteger(value) && value > 0;
const inFolder = (path, id, variant) =>
  typeof path === "string" && path.startsWith(`community/${id}/${variant}.`);

function checkCaption(caption) {
  const text = String(caption ?? "").trim();
  return text.length > CAPTION_MAX
    ? {ok: false, error: `Captions must be ${CAPTION_MAX} characters or fewer.`}
    : {ok: true, caption: text};
}

// Validates the create body after uploads finish. {ok, post} | {ok: false, error}
export function validatePost(input) {
  const {id, type, mediaPath, posterPath, width, height, duration} = input ?? {};
  if (!isUuid(id)) return {ok: false, error: "Invalid post id"};
  if (!POST_TYPES.includes(type)) return {ok: false, error: "Invalid post type"};
  if (!inFolder(mediaPath, id, "original")) return {ok: false, error: "Invalid media path"};
  if (!positiveInt(width) || !positiveInt(height)) {
    return {ok: false, error: "Invalid media size"};
  }
  const caption = checkCaption(input.caption);
  if (!caption.ok) return caption;
  if (type === "photo") {
    return {
      ok: true,
      post: {id, type, mediaPath, posterPath: null, width, height, duration: null, caption: caption.caption},
    };
  }
  if (!inFolder(posterPath, id, "poster")) return {ok: false, error: "Videos need a poster frame"};
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration > MEDIA_RULES.video.maxSeconds
  ) {
    return {ok: false, error: `Videos must be ${MEDIA_RULES.video.maxSeconds} seconds or shorter.`};
  }
  return {
    ok: true,
    post: {id, type, mediaPath, posterPath, width, height, duration, caption: caption.caption},
  };
}

// PATCH body → {ok, changes: {caption?, status?, pinned?}} | {ok: false, error}
export function validatePostPatch(input) {
  if (!input || typeof input !== "object") return {ok: false, error: "Invalid body"};
  const changes = {};
  if (input.caption !== undefined) {
    const caption = checkCaption(input.caption);
    if (!caption.ok) return caption;
    changes.caption = caption.caption;
  }
  if (input.status !== undefined) {
    if (!POST_STATUSES.includes(input.status)) return {ok: false, error: "Invalid status"};
    changes.status = input.status;
  }
  if (input.pinned !== undefined) {
    if (typeof input.pinned !== "boolean") return {ok: false, error: "Invalid pinned"};
    changes.pinned = input.pinned;
  }
  if (!Object.keys(changes).length) return {ok: false, error: "Nothing to update"};
  return {ok: true, changes};
}

const time = iso => (iso ? new Date(iso).getTime() : 0);

// Client-side mirror of orderFeed in lib/community/queries.js: pinned first
// (newest pin first), then newest, then id. Used after optimistic updates.
export function orderPosts(posts, {includeHidden = true} = {}) {
  return posts
    .filter(p => includeHidden || p.status === "published")
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        (a.pinned ? time(b.pinnedAt) - time(a.pinnedAt) : 0) ||
        time(b.createdAt) - time(a.createdAt) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
}

export const formatDuration = seconds => {
  const total = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

const UNITS = [
  ["minute", 60],
  ["hour", 60 * 60],
  ["day", 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
];

// "just now", "5 minutes ago", "3 days ago", "2 weeks ago"; older posts get a date.
export function relativeTime(iso, now = Date.now()) {
  const seconds = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds >= 5 * 7 * 24 * 60 * 60) {
    return new Date(iso).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
  }
  const [unit, size] = UNITS.findLast(([, size]) => seconds >= size);
  const count = Math.floor(seconds / size);
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}
