import {revalidatePath} from "next/cache";
import {getAdminSession} from "../../../../lib/admin/session";
import {isUuid} from "../../../../lib/analytics/schema.mjs";
import {validatePostPatch} from "../../../../lib/community/schema.mjs";
import {postFromRow} from "../../../../lib/db/rows.mjs";
import {deleteObjects, publicUrl} from "../../../../lib/media/storage";
import {supabaseAdmin} from "../../../../lib/supabase/admin";

const unauthorized = () => Response.json({error: "Unauthorized"}, {status: 401});
const notFound = () => Response.json({error: "Post not found"}, {status: 404});
const serverError = () => Response.json({error: "Server Error"}, {status: 500});

function revalidateFeed() {
  revalidatePath("/community");
  revalidatePath("/");
}

// caption, status (published | hidden) and/or pinned.
export async function PATCH(req, {params}) {
  if (!(await getAdminSession())) return unauthorized();
  const {id} = await params;
  if (!isUuid(id)) return notFound();
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({error: "Invalid JSON"}, {status: 400});
  }
  const check = validatePostPatch(body);
  if (!check.ok) return Response.json({error: check.error}, {status: 400});
  const {pinned, ...changes} = check.changes;
  const now = new Date().toISOString();
  if (pinned !== undefined) {
    changes.pinned = pinned;
    changes.pinned_at = pinned ? now : null;
  }
  const {data, error} = await supabaseAdmin()
    .from("community_posts")
    .update({...changes, updated_at: now})
    .eq("id", id)
    .select("*");
  if (error) {
    console.error("Error updating community post", error);
    return serverError();
  }
  if (!data.length) return notFound();
  revalidateFeed();
  return Response.json({post: postFromRow(data[0], publicUrl)});
}

// Deletes the post, then its Storage objects.
export async function DELETE(req, {params}) {
  if (!(await getAdminSession())) return unauthorized();
  const {id} = await params;
  if (!isUuid(id)) return notFound();
  const {data, error} = await supabaseAdmin()
    .from("community_posts")
    .delete()
    .eq("id", id)
    .select("media_path, poster_path");
  if (error) {
    console.error("Error deleting community post", error);
    return serverError();
  }
  if (!data.length) return notFound();
  await deleteObjects([data[0].media_path, data[0].poster_path]).catch(err =>
    console.error("Error deleting community media", err),
  );
  revalidateFeed();
  return Response.json({success: true});
}
