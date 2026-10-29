import {createAuthClient} from "../../../lib/supabase/server";
import {safeNext} from "../../../lib/admin/allowed.mjs";

export const dynamic = "force-dynamic";

// Starts Google sign-in. `hd` only pre-filters the account picker; the
// signup hook and the callback enforce the domain.
export async function GET(req) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const supabase = await createAuthClient();
  const {data, error} = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {hd: "trainnos.com", prompt: "select_account"},
    },
  });
  if (error) {
    console.error("Error starting Google sign-in", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
  return Response.redirect(data.url, 307);
}
