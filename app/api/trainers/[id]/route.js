import {revalidatePath} from "next/cache";
import {getAdminSession} from "../../../../lib/admin/session";
import {trainerFromRow, trainerToRow} from "../../../../lib/db/rows.mjs";
import {deleteObjects, finalizeUpload, publicUrl} from "../../../../lib/media/storage";
import {isFounder, validateTrainer} from "../../../../lib/trainers/schema.mjs";
import {nextSortOrder} from "../../../../lib/trainers/store";
import {supabaseAdmin} from "../../../../lib/supabase/admin";

const unauthorized = () => Response.json({error: "Unauthorized"}, {status: 401});
const notFound = () => Response.json({error: "Trainer not found"}, {status: 404});
const serverError = () => Response.json({error: "Server Error"}, {status: 500});

async function readTrainer(id) {
  const {data, error} = await supabaseAdmin()
    .from("trainers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Any profile field, photoPath (replaces the photo), active (remove or
// re-add) or sortOrder.
export async function PATCH(req, {params}) {
  if (!(await getAdminSession())) return unauthorized();
  const {id} = await params;
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({error: "Invalid JSON"}, {status: 400});
  }
  if (!body || typeof body !== "object") {
    return Response.json({error: "Invalid body"}, {status: 400});
  }
  const check = validateTrainer(body, {partial: true});
  if (!check.ok) return Response.json({error: check.error}, {status: 400});
  const changes = {...check.trainer};
  if (body.active !== undefined && typeof body.active !== "boolean") {
    return Response.json({error: "Invalid active"}, {status: 400});
  }
  if (body.sortOrder !== undefined && !Number.isInteger(body.sortOrder)) {
    return Response.json({error: "Invalid sortOrder"}, {status: 400});
  }
  if (body.photoPath !== undefined) {
    if (typeof body.photoPath !== "string" || !body.photoPath.startsWith("trainers/")) {
      return Response.json({error: "Invalid photo"}, {status: 400});
    }
    changes.photoPath = body.photoPath;
  }

  let current;
  try {
    current = await readTrainer(id);
    if (!current) return notFound();
    if (changes.position !== undefined && isFounder(current)) {
      return Response.json({error: "Co-Founder titles can't be changed."}, {status: 400});
    }
    if (body.active === false && isFounder(current)) {
      return Response.json({error: "Co-Founders can't be removed from the site."}, {status: 400});
    }
    if (changes.photoPath && changes.photoPath !== current.photo_path) {
      try {
        await finalizeUpload(changes.photoPath, {kind: "image"});
      } catch (error) {
        console.error("Error finalizing trainer photo", error);
        return Response.json({error: "The photo didn't upload. Pick it again."}, {status: 400});
      }
    }
    if (body.active === false && current.active) {
      changes.active = false;
      changes.removedAt = new Date().toISOString();
    } else if (body.active === true && !current.active) {
      changes.active = true;
      changes.removedAt = null;
      changes.sortOrder = await nextSortOrder();
    } else if (body.sortOrder !== undefined) {
      changes.sortOrder = body.sortOrder;
    }
  } catch (error) {
    console.error("Error preparing trainer update", error);
    return serverError();
  }

  const {data, error} = await supabaseAdmin()
    .from("trainers")
    .update({...trainerToRow(changes), updated_at: new Date().toISOString()})
    .eq("id", id)
    .select("*");
  if (error) {
    console.error("Error updating trainer", error);
    return serverError();
  }
  if (!data.length) return notFound();
  if (changes.photoPath && changes.photoPath !== current.photo_path) {
    await deleteObjects([current.photo_path]).catch(err =>
      console.error("Error deleting old trainer photo", err),
    );
  }
  revalidatePath("/meet");
  return Response.json({trainer: trainerFromRow(data[0], publicUrl)});
}

// Permanent delete, only for trainers already removed from the site.
export async function DELETE(req, {params}) {
  if (!(await getAdminSession())) return unauthorized();
  const {id} = await params;
  let current;
  try {
    current = await readTrainer(id);
  } catch (error) {
    console.error("Error reading trainer", error);
    return serverError();
  }
  if (!current) return notFound();
  if (current.active) {
    return Response.json(
      {error: "Remove this trainer from the site before deleting them."},
      {status: 409},
    );
  }
  const {error} = await supabaseAdmin().from("trainers").delete().eq("id", id);
  if (error) {
    console.error("Error deleting trainer", error);
    return serverError();
  }
  await deleteObjects([current.photo_path]).catch(err =>
    console.error("Error deleting trainer photo", err),
  );
  revalidatePath("/meet");
  return Response.json({success: true});
}
