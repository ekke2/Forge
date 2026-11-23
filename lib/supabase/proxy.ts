import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { hasSupabaseEnv } from "@/lib/utils";

/** Paths reachable without a session. */
const PUBLIC_PREFIXES = ["/auth", "/api/cron", "/api/github/webhook"];
const PUBLIC_EXACT = new Set(["/", "/pricing"]);

function isPublic(pathname: string) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Before the project is configured, don't gate anything.
  if (!hasSupabaseEnv) return supabaseResponse;

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Signed-in users have no reason to see the marketing or auth screens.
  if (user && (pathname === "/" || pathname.startsWith("/auth/login") || pathname.startsWith("/auth/sign-up"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
