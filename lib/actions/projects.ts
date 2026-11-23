"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { runSync } from "@/lib/sync/engine";
import {
  fail,
  isActionError,
  loadMemberContext,
  slugify,
  type ActionResult,
} from "@/lib/actions/util";

const createSchema = z.object({
  repoFullName: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/, "Expected owner/repository"),
  name: z.string().min(1).max(60).optional(),
  description: z.string().max(280).optional(),
  isPrivate: z.boolean().optional(),
  repoGithubId: z.number().optional(),
  defaultBranch: z.string().optional(),
});

export async function createProjectAction(
  input: z.infer<typeof createSchema>,
): Promise<ActionResult<{ slug: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return fail("validation", parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const user = await getSessionUser();
  if (!user) return fail("unauthenticated", "Please sign in.");

  const [repoOwner, repoName] = parsed.data.repoFullName.split("/");
  const name = parsed.data.name?.trim() || repoName;
  const supabase = await createClient();

  // Ensure a unique per-owner slug.
  let slug = slugify(name) || slugify(repoName) || "project";
  const { data: existing } = await supabase
    .from("projects")
    .select("slug")
    .eq("owner_id", user.id)
    .like("slug", `${slug}%`);
  if (existing?.some((r) => r.slug === slug)) {
    slug = `${slug}-${(existing.length + 1).toString(36)}`;
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name,
      slug,
      owner_id: user.id,
      description: parsed.data.description ?? null,
      repo_owner: repoOwner,
      repo_name: repoName,
      repo_full_name: parsed.data.repoFullName,
      repo_github_id: parsed.data.repoGithubId ?? null,
      default_branch: parsed.data.defaultBranch ?? "main",
      is_private: parsed.data.isPrivate ?? false,
      github_mode: process.env.GITHUB_MODE === "live" ? "live" : "mock",
    })
    .select("id, slug")
    .single();

  if (error || !project) {
    return fail("unknown", error?.message ?? "Could not create the project.");
  }

  // Initial synchronisation — the connect flow shows progress off the sync_run.
  try {
    await runSync({
      projectId: project.id,
      trigger: "initial",
      viewerLogin: user.profile?.github_username ?? null,
    });
  } catch {
    // The project still exists; the connect screen will surface the failed run
    // and offer a retry.
  }

  revalidatePath("/app", "layout");
  return { ok: true, data: { slug: project.slug } };
}

export async function syncProjectAction(
  projectId: string,
): Promise<ActionResult<{ stats: Record<string, number> | null }>> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;

  const result = await runSync({
    projectId,
    trigger: "manual",
    viewerLogin: ctx.user.profile?.github_username ?? null,
  });

  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  if (!result.ok) return fail("github_error", result.error ?? "Sync failed.");
  return {
    ok: true,
    data: {
      stats: result.stats
        ? (result.stats as unknown as Record<string, number>)
        : null,
    },
  };
}

const settingsSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(280).nullable().optional(),
});

export async function updateProjectSettingsAction(
  projectId: string,
  input: z.infer<typeof settingsSchema>,
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return fail("forbidden", "Only owners and admins can change settings.");
  }
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail("validation", "Invalid settings.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .eq("id", projectId);
  if (error) return fail("unknown", error.message);

  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true };
}

export async function deleteProjectAction(
  projectId: string,
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  if (ctx.role !== "owner") {
    return fail("forbidden", "Only the owner can delete a project.");
  }
  // Service role: cascade removes all cache + Forge-owned rows.
  const admin = createAdminClient();
  const { error } = await admin.from("projects").delete().eq("id", projectId);
  if (error) return fail("unknown", error.message);
  revalidatePath("/app", "layout");
  return { ok: true };
}
