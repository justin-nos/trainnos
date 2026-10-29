import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";

// Cookie-bound client for reading the admin's auth session. Server
// Components can't set cookies, so setAll failures are ignored there;
// proxy.js refreshes the session instead.
export async function createAuthClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: list => {
          try {
            for (const {name, value, options} of list) store.set(name, value, options);
          } catch {}
        },
      },
    },
  );
}
