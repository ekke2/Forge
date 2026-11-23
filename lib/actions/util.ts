import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

export type ActionError =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation"
  | "upgrade_required"
  | "github_error"
  | "unknown";

export type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; error: ActionError; message: string };

export function fail(error: ActionError, message: string): ActionResult<never> {
  return { ok: false, error, message };
}

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type MemberRole = Database["public"]["Enums"]["member_role"];

export interface MemberContext {
  user: SessionUser;
  project: ProjectRow;
  role: MemberRole;
  memberCount: number;
}

/**
 * Verifies the caller is a member of `projectId` before any project-scoped
 * mutation. Never trust the client — Instructions §42.
 */
export async function loadMemberContext(
  projectId: string,
): Promise<MemberContext | ActionResult<never>> {
  const user = await getSessionUser();
  if (!user) return fail("unauthenticated", "Please sign in.");

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return fail("not_found", "Project not found.");

  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return fail("forbidden", "You don't have access to this project.");

  const { count } = await supabase
    .from("project_members")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  return {
    user,
    project,
    role: membership.role,
    memberCount: count ?? 1,
  };
}

export function isActionError<T>(
  value: MemberContext | ActionResult<T>,
): value is ActionResult<never> {
  return (value as ActionResult).ok === false;
}

export function canManageRole(role: MemberRole) {
  return role === "owner" || role === "admin";
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
