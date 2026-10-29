import {createClient} from "@supabase/supabase-js";

// Server-only client with the secret key (bypasses RLS). Never import from
// client components.
let client;
export function supabaseAdmin() {
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {auth: {persistSession: false, autoRefreshToken: false}},
  );
  return client;
}
