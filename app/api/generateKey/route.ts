import {randomUUID} from "node:crypto";
import {getAdminSession} from "../../../lib/admin/session";
import {supabaseAdmin} from "../../../lib/supabase/admin";

// Creates a one-time testimonial form link token. Admins only.
export async function POST() {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  const token = randomUUID();
  const {error} = await supabaseAdmin().from("testimonial_links").insert({token});
  if (error) {
    console.error("Error creating testimonial link", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
  return Response.json({success: true, token});
}
