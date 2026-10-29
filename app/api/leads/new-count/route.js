import {getAdminSession} from "../../../../lib/admin/session";
import {supabaseAdmin} from "../../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

// How many leads nobody has followed up yet.
export async function GET() {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  try {
    const {count, error} = await supabaseAdmin()
      .from("leads")
      .select("id", {count: "exact", head: true})
      .eq("status", "new");
    if (error) throw error;
    return Response.json({count});
  } catch (error) {
    console.error("Error counting new leads", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
}
