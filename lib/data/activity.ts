import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type ActivityRow = Database["public"]["Tables"]["activity"]["Row"];

export async function listActivity(
  projectId: string,
  limit = 50,
): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity")
    .select("*")
    .eq("project_id", projectId)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
