import {createAuthClient} from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  return Response.redirect(new URL("/", req.url), 307);
}
