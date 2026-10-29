import {createAuthClient} from "../../../lib/supabase/server";
import {isAdminUser, safeNext} from "../../../lib/admin/allowed.mjs";

export const dynamic = "force-dynamic";

// Google sends the admin back here with a code. A rejected sign-up (the
// domain hook) comes back with ?error=... instead.
export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const denied = new URL("/auth/denied", url.origin);
  if (!code) return Response.redirect(denied, 307);

  const supabase = await createAuthClient();
  const {data, error} = await supabase.auth.exchangeCodeForSession(code);
  if (error || !isAdminUser(data.user)) {
    if (error) console.error("Error finishing Google sign-in", error);
    await supabase.auth.signOut();
    return Response.redirect(denied, 307);
  }
  const next = safeNext(url.searchParams.get("next"));
  return Response.redirect(new URL(next, url.origin), 307);
}
