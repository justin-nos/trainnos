import {supabaseAdmin} from "../supabase/admin";

// One past the last active trainer, so new and re-added trainers go to the end.
export async function nextSortOrder() {
  const {data, error} = await supabaseAdmin()
    .from("trainers")
    .select("sort_order")
    .eq("active", true)
    .order("sort_order", {ascending: false})
    .limit(1);
  if (error) throw error;
  return (data[0]?.sort_order ?? -1) + 1;
}
