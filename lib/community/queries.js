import {postFromRow} from "../db/rows.mjs";
import {publicUrl} from "../media/storage";
import {supabaseAdmin} from "../supabase/admin";

// Feed order shared by the admin library and the public pages: pinned first
// (newest pin first), then newest. orderPosts in schema.mjs mirrors it.
export const orderFeed = query =>
  query
    .order("pinned", {ascending: false})
    .order("pinned_at", {ascending: false, nullsFirst: false})
    .order("created_at", {ascending: false})
    .order("id");

// Published posts for public pages. On error this logs and returns [], so
// /community and the homepage never fail because of the feed.
export async function getPublishedPosts({limit} = {}) {
  try {
    let query = orderFeed(
      supabaseAdmin().from("community_posts").select("*").eq("status", "published"),
    );
    if (limit) query = query.limit(limit);
    const {data, error} = await query;
    if (error) throw error;
    return data.map(row => postFromRow(row, publicUrl));
  } catch (error) {
    console.error("Error reading community posts", error);
    return [];
  }
}
