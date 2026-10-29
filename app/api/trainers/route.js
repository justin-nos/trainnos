import {revalidatePath} from "next/cache";
import {getAdminSession} from "../../../lib/admin/session";
import {trainerFromRow, trainerToRow} from "../../../lib/db/rows.mjs";
import {deleteObjects, finalizeUpload, publicUrl} from "../../../lib/media/storage";
import {validateTrainer} from "../../../lib/trainers/schema.mjs";
import {nextSortOrder} from "../../../lib/trainers/store";
import {supabaseAdmin} from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  const {data, error} = await supabaseAdmin()
    .from("trainers")
    .select("*")
    .order("sort_order");
  if (error) {
    console.error("Error reading trainers", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
  return Response.json({trainers: data.map(row => trainerFromRow(row, publicUrl))});
}

export async function POST(req) {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({error: "Invalid JSON"}, {status: 400});
  }
  const check = validateTrainer(body);
  if (!check.ok) return Response.json({error: check.error}, {status: 400});
  const photoPath = body.photoPath;
  if (typeof photoPath !== "string" || !photoPath.startsWith("trainers/")) {
    return Response.json({error: "Add a photo."}, {status: 400});
  }
  try {
    await finalizeUpload(photoPath, {kind: "image"});
  } catch (error) {
    console.error("Error finalizing trainer photo", error);
    return Response.json({error: "The photo didn't upload. Pick it again."}, {status: 400});
  }

  let data, error;
  try {
    ({data, error} = await supabaseAdmin()
      .from("trainers")
      .insert({
        ...trainerToRow({...check.trainer, photoPath}),
        sort_order: await nextSortOrder(),
      })
      .select("*")
      .single());
  } catch (err) {
    error = err;
  }
  if (error) {
    console.error("Error adding trainer", error);
    await deleteObjects([photoPath]).catch(() => {});
    return Response.json({error: "Server Error"}, {status: 500});
  }
  revalidatePath("/meet");
  return Response.json({trainer: trainerFromRow(data, publicUrl)}, {status: 201});
}
