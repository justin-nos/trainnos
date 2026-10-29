// What admins may upload, and where it lands in Storage.
export const MEDIA_RULES = {
  image: {
    types: {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"},
    maxBytes: 15 * 1024 * 1024,
  },
  video: {
    types: {"video/mp4": "mp4", "video/quicktime": "mov"},
    maxBytes: 200 * 1024 * 1024,
    maxSeconds: 90,
  },
};
export const PURPOSES = ["community", "trainer"];
export const VARIANTS = ["original", "poster"];

const ALLOWED_KINDS = {trainer: ["image"], community: ["image", "video"]};
const FOLDERS = {trainer: "trainers", community: "community"};

const megabytes = bytes => `${Math.round(bytes / (1024 * 1024))} MB`;

export function mediaKind(contentType) {
  for (const [kind, rule] of Object.entries(MEDIA_RULES)) {
    if (Object.hasOwn(rule.types, contentType)) return kind;
  }
  return null;
}

// {ok: true, kind, ext} or {ok: false, error} with admin-readable copy.
export function checkUpload({purpose, contentType, size}) {
  if (!PURPOSES.includes(purpose)) return {ok: false, error: "Unknown upload type"};
  const kind = mediaKind(contentType);
  if (!kind || !ALLOWED_KINDS[purpose].includes(kind)) {
    return {
      ok: false,
      error:
        purpose === "trainer"
          ? "Trainer photos must be JPEG, PNG or WebP."
          : "Only JPEG, PNG or WebP photos and MP4 or MOV videos can be posted.",
    };
  }
  const {maxBytes, types} = MEDIA_RULES[kind];
  if (!Number.isFinite(size) || size <= 0) {
    return {ok: false, error: "This file looks empty."};
  }
  if (size > maxBytes) {
    return {
      ok: false,
      error: `This ${kind === "video" ? "video" : "photo"} is ${megabytes(size)}; the limit is ${megabytes(maxBytes)}.`,
    };
  }
  return {ok: true, kind, ext: types[contentType]};
}

export function objectPath({purpose, id, ext, variant = "original"}) {
  return `${FOLDERS[purpose]}/${id}/${variant}.${ext}`;
}

// Accept strings for UI <input accept>, derived from MEDIA_RULES.
const imageTypes = Object.keys(MEDIA_RULES.image.types);
const videoTypes = Object.keys(MEDIA_RULES.video.types);
export const ACCEPT = {
  trainer: imageTypes.join(","),
  community: [...imageTypes, ...videoTypes].join(","),
};
