import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Service-role Supabase client. Bypasses Row Level Security, so it must only
 * ever be used from trusted server code (the sync engine, cron jobs) AFTER the
 * caller has independently verified the user's access to the project.
 *
 * This is the ONLY client permitted to write the `*_cache` tables — see the
 * architectural note at the top of supabase/migrations/0001_init.sql.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — the sync engine cannot write cache tables.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
