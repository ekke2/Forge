"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_PLAN_MEMBER_LIMIT } from "@/lib/constants";
import {
  canManageRole,
  fail,
  isActionError,
  loadMemberContext,
  type ActionResult,
} from "@/lib/actions/util";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

/**
 * Simulated invite: adds an existing Forge user (by e-mail) to the project.
 * The paygate lives here — Free projects are capped at one member, so growing a
 * team requires the Team plan (Instructions: "paygate for a software team").
 */
export async function inviteMemberAction(
  projectId: string,
  input: z.infer<typeof inviteSchema>,
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  if (!canManageRole(ctx.role)) {
    return fail("forbidden", "Only owners and admins can invite people.");
  }
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return fail("validation", "Enter a valid e-mail address.");

  if (ctx.project.plan === "free" && ctx.memberCount >= FREE_PLAN_MEMBER_LIMIT) {
    return fail(
      "upgrade_required",
      "The Free plan is limited to one member. Upgrade to Team to invite people.",
    );
  }

  // Look up the target — must already have a Forge account.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, display_name")
    .ilike("email", parsed.data.email)
    .maybeSingle();
  if (!profile) {
    return fail(
      "not_found",
      "No Forge account with that e-mail yet. Ask them to sign in once, then invite again.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: profile.id,
    role: parsed.data.role,
  });
  if (error) {
    if (error.code === "23505") {
      return fail("validation", "That person is already a member.");
    }
    return fail("unknown", error.message);
  }

  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true };
}

export async function removeMemberAction(
  projectId: string,
  userId: string,
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  if (!canManageRole(ctx.role)) {
    return fail("forbidden", "Only owners and admins can remove people.");
  }
  if (userId === ctx.project.owner_id) {
    return fail("validation", "The project owner can't be removed.");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) return fail("unknown", error.message);
  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true };
}

export async function updateMemberRoleAction(
  projectId: string,
  userId: string,
  role: "admin" | "member" | "viewer",
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  if (ctx.role !== "owner") {
    return fail("forbidden", "Only the owner can change roles.");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .update({ role })
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) return fail("unknown", error.message);
  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true };
}
