"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getGitHubSource } from "@/lib/github/source";
import type { GitHubIssue } from "@/lib/github/types";
import { toJson } from "@/lib/json";
import {
  fail,
  isActionError,
  loadMemberContext,
  type ActionResult,
} from "@/lib/actions/util";

/** Mirror a freshly created/updated GitHub issue into issues_cache. */
async function writeIssueToCache(projectId: string, issue: GitHubIssue) {
  const admin = createAdminClient();
  await admin.from("issues_cache").upsert(
    {
      project_id: projectId,
      github_id: issue.github_id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      state_reason: issue.state_reason,
      author_login: issue.author?.login ?? null,
      author_avatar_url: issue.author?.avatar_url ?? null,
      assignees: toJson(issue.assignees),
      labels: toJson(issue.labels),
      comments_count: issue.comments_count,
      milestone_title: issue.milestone_title,
      html_url: issue.html_url,
      github_created_at: issue.created_at,
      github_updated_at: issue.updated_at,
      github_closed_at: issue.closed_at,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "project_id,number" },
  );
  return admin;
}

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(240),
  body: z.string().max(20_000).optional(),
  assignees: z.array(z.string()).max(10).optional(),
  labels: z.array(z.string()).max(15).optional(),
  workflowStatus: z
    .enum(["todo", "in_progress", "in_review", "done"])
    .optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
});

export async function createIssueAction(
  projectId: string,
  input: z.infer<typeof createSchema>,
): Promise<ActionResult<{ number: number }>> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return fail("validation", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const admin = createAdminClient();
  const source = getGitHubSource({
    project: ctx.project,
    admin,
    viewerLogin: ctx.user.profile?.github_username ?? null,
  });

  // 1) Write to GitHub first. Only on success do we touch our cache.
  let issue: GitHubIssue;
  try {
    issue = await source.createIssue({
      title: parsed.data.title,
      body: parsed.data.body,
      assignees: parsed.data.assignees,
      labels: parsed.data.labels,
    });
  } catch (err) {
    return fail(
      "github_error",
      err instanceof Error ? err.message : "GitHub rejected the issue.",
    );
  }

  // 2) Mirror into the local cache.
  await writeIssueToCache(projectId, issue);

  // 3) Optional Forge workflow overlay.
  if (parsed.data.workflowStatus || parsed.data.priority) {
    const supabase = await createClient();
    await supabase.from("issue_workflow").upsert(
      {
        project_id: projectId,
        issue_number: issue.number,
        status: parsed.data.workflowStatus ?? "todo",
        priority: parsed.data.priority ?? "none",
        position: issue.number,
        updated_by: ctx.user.id,
      },
      { onConflict: "project_id,issue_number" },
    );
  }

  // 4) Activity.
  await admin.from("activity").upsert(
    {
      project_id: projectId,
      source: "forge",
      actor_login: ctx.user.profile?.github_username ?? null,
      actor_avatar_url: ctx.user.profile?.avatar_url ?? null,
      actor_id: ctx.user.id,
      verb: "created",
      object_type: "issue",
      object_ref: `#${issue.number}`,
      title: issue.title,
      summary: `${ctx.user.profile?.display_name ?? "Someone"} created issue #${issue.number} in Forge`,
      url: issue.html_url,
      occurred_at: new Date().toISOString(),
      dedupe_key: `issue-created-forge-${issue.number}`,
    },
    { onConflict: "project_id,dedupe_key" },
  );

  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true, data: { number: issue.number } };
}

const workflowSchema = z.object({
  status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
  position: z.number().optional(),
});

export async function setIssueWorkflowAction(
  projectId: string,
  issueNumber: number,
  patch: z.infer<typeof workflowSchema>,
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  const parsed = workflowSchema.safeParse(patch);
  if (!parsed.success) return fail("validation", "Invalid workflow update.");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("issue_workflow")
    .select("*")
    .eq("project_id", projectId)
    .eq("issue_number", issueNumber)
    .maybeSingle();

  const { error } = await supabase.from("issue_workflow").upsert(
    {
      project_id: projectId,
      issue_number: issueNumber,
      status: parsed.data.status ?? existing?.status ?? "todo",
      priority: parsed.data.priority ?? existing?.priority ?? "none",
      position: parsed.data.position ?? existing?.position ?? issueNumber,
      updated_by: ctx.user.id,
    },
    { onConflict: "project_id,issue_number" },
  );
  if (error) return fail("unknown", error.message);

  if (parsed.data.status && parsed.data.status !== existing?.status) {
    const admin = createAdminClient();
    await admin.from("activity").upsert(
      {
        project_id: projectId,
        source: "forge",
        actor_login: ctx.user.profile?.github_username ?? null,
        actor_avatar_url: ctx.user.profile?.avatar_url ?? null,
        actor_id: ctx.user.id,
        verb: "moved",
        object_type: "workflow",
        object_ref: `#${issueNumber}`,
        title: null,
        summary: `${ctx.user.profile?.display_name ?? "Someone"} moved #${issueNumber} to ${parsed.data.status.replace("_", " ")}`,
        url: `/app/${ctx.project.slug}/issues/${issueNumber}`,
        occurred_at: new Date().toISOString(),
        dedupe_key: `workflow-${issueNumber}-${Date.now()}`,
      },
      { onConflict: "project_id,dedupe_key" },
    );
  }

  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true };
}

const updateSchema = z.object({
  state: z.enum(["open", "closed"]).optional(),
  assignees: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
  title: z.string().min(1).max(240).optional(),
  body: z.string().max(20_000).optional(),
});

export async function updateIssueAction(
  projectId: string,
  issueNumber: number,
  input: z.infer<typeof updateSchema>,
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return fail("validation", "Invalid issue update.");

  const admin = createAdminClient();
  const source = getGitHubSource({
    project: ctx.project,
    admin,
    viewerLogin: ctx.user.profile?.github_username ?? null,
  });

  let issue: GitHubIssue;
  try {
    issue = await source.updateIssue(issueNumber, parsed.data);
  } catch (err) {
    return fail(
      "github_error",
      err instanceof Error ? err.message : "GitHub rejected the update.",
    );
  }
  await writeIssueToCache(projectId, issue);

  // Keep GitHub state authoritative on the board: a closed issue is Done.
  if (parsed.data.state) {
    const supabase = await createClient();
    if (parsed.data.state === "closed") {
      await supabase.from("issue_workflow").upsert(
        {
          project_id: projectId,
          issue_number: issueNumber,
          status: "done",
          updated_by: ctx.user.id,
        },
        { onConflict: "project_id,issue_number" },
      );
    }
  }

  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true };
}
