import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type MemberRole = Database["public"]["Enums"]["member_role"];

export interface SessionUser {
  id: string;
  email: string | null;
  profile: Profile | null;
}

/** Current user + profile, or null. Memoised per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  return { id: data.user.id, email: data.user.email ?? null, profile };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  return user;
}

/** The GitHub provider token for the current session, if the user linked GitHub. */
export async function getGitHubToken(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.provider_token ?? null;
}

export interface ProjectAccess {
  project: ProjectRow;
  role: MemberRole;
  user: SessionUser;
}

/**
 * Loads a project the current user is a member of. Because the query runs under
 * the user's session, RLS guarantees a non-member simply gets no row — we never
 * trust an id from the URL. Redirects on failure.
 */
export const requireProjectAccess = cache(
  async (slugOrId: string): Promise<ProjectAccess> => {
    const user = await requireUser();
    const supabase = await createClient();

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slugOrId,
      );

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq(isUuid ? "id" : "slug", slugOrId)
      .maybeSingle();

    if (!project) redirect("/app");

    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", project.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) redirect("/app");

    return { project, role: membership.role, user };
  },
);

export function canManage(role: MemberRole) {
  return role === "owner" || role === "admin";
}
