import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Request-scoped Supabase client bound to the caller's session cookies. Runs as
 * the authenticated user, so every query is subject to Row Level Security.
 *
 * Never hoist this into a module-level singleton (Fluid compute / RSC will share
 * it across requests); always create one per invocation.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore when the proxy
            // is refreshing sessions.
          }
        },
      },
    },
  );
}
