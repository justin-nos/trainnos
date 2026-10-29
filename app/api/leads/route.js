import {getAdminSession} from "../../../lib/admin/session";
import {leadFromRow} from "../../../lib/db/rows.mjs";
import {supabaseAdmin} from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  try {
    const {data, error} = await supabaseAdmin()
      .from("leads")
      .select("*")
      .order("created_at", {ascending: false})
      .limit(200);
    if (error) throw error;
    return Response.json({leads: data.map(leadFromRow)});
  } catch (error) {
    console.error("Error reading leads", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
}
