import {revalidatePath} from "next/cache";
import {getAdminSession} from "../../../lib/admin/session";
import {validatePost} from "../../../lib/community/schema.mjs";
import {orderFeed} from "../../../lib/community/queries";
import {postFromRow, postToRow} from "../../../lib/db/rows.mjs";
import {deleteObjects, finalizeUpload, publicUrl} from "../../../lib/media/storage";
import {supabaseAdmin} from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

// Every post, hidden ones included, in feed order.
export async function GET() {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  const {data, error} = await orderFeed(supabaseAdmin().from("community_posts").select("*"));
  if (error) {
    console.error("Error reading community posts", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
  return Response.json({posts: data.map(row => postFromRow(row, publicUrl))});
}

// Publishes a post whose media (and poster, for videos) is already uploaded.
export async function POST(req) {
  const session = await getAdminSession();
  if (!session) return Response.json({error: "Unauthorized"}, {status: 401});
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({error: "Invalid JSON"}, {status: 400});
  }
  const check = validatePost(body);
  if (!check.ok) return Response.json({error: check.error}, {status: 400});
  const {post} = check;

  let media;
  try {
    media = await finalizeUpload(post.mediaPath, {
      kind: post.type === "photo" ? "image" : "video",
    });
    if (post.posterPath) await finalizeUpload(post.posterPath, {kind: "image"});
  } catch (error) {
    console.error("Error finalizing community upload", error);
    return Response.json({error: "The upload didn't finish. Retry it."}, {status: 400});
  }

  const {data, error} = await supabaseAdmin()
    .from("community_posts")
    .insert(postToRow({post, contentType: media.contentType, uploadedBy: session.user.email}))
    .select("*")
    .single();
  if (error) {
    console.error("Error saving community post", error);
    await deleteObjects([post.mediaPath, post.posterPath]).catch(() => {});
    return Response.json({error: "Server Error"}, {status: 500});
  }
  revalidatePath("/community");
  revalidatePath("/");
  return Response.json({post: postFromRow(data, publicUrl)}, {status: 201});
}
