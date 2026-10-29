import {getAdminSession} from "../../../../lib/admin/session";
import {supabaseAdmin} from "../../../../lib/supabase/admin";

const STATUSES = ["new", "contacted", "booked", "not-a-fit"];

export async function PATCH(req, {params}) {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  const {id} = await params;
  let status;
  try {
    ({status} = await req.json());
  } catch {
    return Response.json({error: "Invalid JSON"}, {status: 400});
  }
  if (!STATUSES.includes(status)) {
    return Response.json({error: "Invalid status"}, {status: 400});
  }
  const {data, error} = await supabaseAdmin()
    .from("leads")
    .update({status, updated_at: new Date().toISOString()})
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("Error updating lead status", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
  if (!data.length) {
    return Response.json({error: "Lead not found"}, {status: 404});
  }
  return Response.json({success: true});
}
