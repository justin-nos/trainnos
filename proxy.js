import {NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";

// Refreshes the admin's Supabase session on every admin request and sends
// signed-out visitors to sign-in. This is only an optimistic check: the
// /admins layout and each admin API call getAdminSession() themselves.
export async function proxy(request) {
  let response = NextResponse.next({request});
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list, headers) => {
          for (const {name, value} of list) request.cookies.set(name, value);
          response = NextResponse.next({request});
          for (const {name, value, options} of list) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  const {
    data: {user},
  } = await supabase.auth.getUser();

  const {pathname, search} = request.nextUrl;
  if (!user && pathname.startsWith("/admins")) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: [
    "/admins/:path*",
    "/api/leads/:path*",
    "/api/analytics/:path*",
    "/api/uploads/:path*",
    "/api/trainers/:path*",
    "/api/community/:path*",
  ],
};
