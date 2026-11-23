import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type SyncRun = Database["public"]["Tables"]["sync_runs"]["Row"];

export interface ProjectListItem extends ProjectRow {
  member_count: number;
  role: Database["public"]["Enums"]["member_role"];
}

export async function listMyProjects(): Promise<ProjectListItem[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("project_members")
    .select("role, project:projects(*)")
    .order("created_at", { ascending: true });

  const projects = (memberships ?? [])
    .map((m) => (m.project ? { ...m.project, role: m.role } : null))
    .filter(Boolean) as (ProjectRow & { role: ProjectListItem["role"] })[];

  if (projects.length === 0) return [];

  const { data: counts } = await supabase
    .from("project_members")
    .select("project_id")
    .in(
      "project_id",
      projects.map((p) => p.id),
    );

  const byProject = new Map<string, number>();
  for (const row of counts ?? []) {
    byProject.set(row.project_id, (byProject.get(row.project_id) ?? 0) + 1);
  }

  return projects.map((p) => ({
    ...p,
    member_count: byProject.get(p.id) ?? 1,
  }));
}

export async function getLatestSyncRun(
  projectId: string,
): Promise<SyncRun | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sync_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export interface ProjectMemberRow {
  user_id: string;
  role: Database["public"]["Enums"]["member_role"];
  created_at: string;
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
}

export async function listProjectMembers(
  projectId: string,
): Promise<ProjectMemberRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_members")
    .select("user_id, role, created_at, profile:profiles(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  return (data ?? []) as ProjectMemberRow[];
}
