import {createAuthClient} from "../supabase/server";
import {isAdminUser} from "./allowed.mjs";

// Server-side admin check for /admins pages and admin API routes. getUser()
// verifies the JWT with Supabase rather than trusting the cookie.
export async function getAdminSession() {
  const supabase = await createAuthClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  return isAdminUser(user) ? {user} : null;
}
