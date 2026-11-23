import type { Json } from "@/lib/database.types";

/**
 * The Supabase-generated `Json` type rejects plain interface types (no index
 * signature). Our GitHub DTOs are structurally JSON-safe, so this is the one
 * sanctioned place to bridge them when writing jsonb columns.
 */
export function toJson<T>(value: T): Json {
  return value as unknown as Json;
}
