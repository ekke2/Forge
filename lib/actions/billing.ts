"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/constants";
import {
  canManageRole,
  fail,
  isActionError,
  loadMemberContext,
  type ActionResult,
} from "@/lib/actions/util";

/**
 * Simulated checkout. No payment processor — flips the project to the Team plan
 * so gated features unlock. A real integration would create a Stripe Checkout
 * session here and complete the flip in a webhook.
 */
export async function upgradePlanAction(
  projectId: string,
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  if (!canManageRole(ctx.role)) {
    return fail("forbidden", "Only owners and admins can change the plan.");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ plan: "team", plan_seats: PLANS.team.seats })
    .eq("id", projectId);
  if (error) return fail("unknown", error.message);

  const admin = createAdminClient();
  await admin.from("activity").upsert(
    {
      project_id: projectId,
      source: "forge",
      actor_id: ctx.user.id,
      actor_login: ctx.user.profile?.github_username ?? null,
      actor_avatar_url: ctx.user.profile?.avatar_url ?? null,
      verb: "created",
      object_type: "task",
      object_ref: null,
      summary: `${ctx.user.profile?.display_name ?? "Someone"} upgraded the project to the Team plan`,
      occurred_at: new Date().toISOString(),
      dedupe_key: `plan-upgrade-${Date.now()}`,
    },
    { onConflict: "project_id,dedupe_key" },
  );

  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true };
}

export async function downgradePlanAction(
  projectId: string,
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  if (ctx.role !== "owner") {
    return fail("forbidden", "Only the owner can change the plan.");
  }
  if (ctx.memberCount > 1) {
    return fail(
      "validation",
      "Remove additional members before returning to the Free plan.",
    );
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ plan: "free", plan_seats: 1 })
    .eq("id", projectId);
  if (error) return fail("unknown", error.message);
  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true };
}
