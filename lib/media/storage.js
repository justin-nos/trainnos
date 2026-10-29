import {supabaseAdmin} from "../supabase/admin";
import {MEDIA_RULES, mediaKind} from "./rules.mjs";

const bucket = () => supabaseAdmin().storage.from("media");

// A URL the browser PUTs the file to (valid for 2 hours). The media bucket
// also enforces the MIME allow-list and the 200 MB cap.
export async function signUpload({path}) {
  const {data, error} = await bucket().createSignedUploadUrl(path);
  if (error) throw error;
  return data.signedUrl;
}

export const publicUrl = path => bucket().getPublicUrl(path).data.publicUrl;

// Confirms the object exists and matches what was signed, then returns its
// public URL. Throws (and deletes the object) if the upload doesn't fit
// MEDIA_RULES[kind]; a missing object throws with status 404.
export async function finalizeUpload(path, {kind}) {
  const {data: info, error} = await bucket().info(path);
  if (error) {
    // Storage answers 400 with statusCode "404" for a missing object.
    if (error.status === 404 || error.statusCode === "404") {
      throw Object.assign(new Error(`No upload at ${path}`), {status: 404});
    }
    throw error;
  }
  const size = Number(info.size);
  // The API returns camelCase despite storage-js's snake_case types.
  const contentType = info.contentType ?? info.content_type;
  if (mediaKind(contentType) !== kind || !(size > 0) || size > MEDIA_RULES[kind].maxBytes) {
    await bucket().remove([path]);
    throw new Error(`Upload at ${path} doesn't match the ${kind} rules`);
  }
  return {path, url: publicUrl(path), contentType, size};
}

export async function deleteObjects(paths) {
  const list = paths.filter(Boolean);
  if (!list.length) return;
  const {error} = await bucket().remove(list);
  if (error) throw error;
}
