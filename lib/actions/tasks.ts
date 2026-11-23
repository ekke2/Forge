"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import {
  fail,
  isActionError,
  loadMemberContext,
  type ActionResult,
} from "@/lib/actions/util";

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(240),
  description: z.string().max(10_000).optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]).default("todo"),
  priority: z
    .enum(["none", "low", "medium", "high", "urgent"])
    .default("none"),
  assigneeId: z.string().uuid().nullable().optional(),
  linkedIssueNumber: z.number().int().positive().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export async function createTaskAction(
  projectId: string,
  input: z.infer<typeof createSchema>,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return fail("validation", parsed.error.issues[0]?.message ?? "Invalid task");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_tasks")
    .insert({
      project_id: projectId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      assignee_id: parsed.data.assigneeId ?? null,
      linked_issue_number: parsed.data.linkedIssueNumber ?? null,
      due_date: parsed.data.dueDate ?? null,
      creator_id: ctx.user.id,
      position: Date.now() % 1_000_000,
    })
    .select("id")
    .single();
  if (error || !data) return fail("unknown", error?.message ?? "Could not create task.");

  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true, data: { id: data.id } };
}

const updateSchema = z.object({
  title: z.string().min(1).max(240).optional(),
  description: z.string().max(10_000).nullable().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  position: z.number().optional(),
});

export async function updateTaskAction(
  projectId: string,
  taskId: string,
  input: z.infer<typeof updateSchema>,
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return fail("validation", "Invalid task update.");

  const supabase = await createClient();
  const patch: Database["public"]["Tables"]["app_tasks"]["Update"] = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.description !== undefined)
    patch.description = parsed.data.description;
  if (parsed.data.status !== undefined) {
    patch.status = parsed.data.status;
    patch.completed_at =
      parsed.data.status === "done" ? new Date().toISOString() : null;
  }
  if (parsed.data.priority !== undefined) patch.priority = parsed.data.priority;
  if (parsed.data.assigneeId !== undefined)
    patch.assignee_id = parsed.data.assigneeId;
  if (parsed.data.dueDate !== undefined) patch.due_date = parsed.data.dueDate;
  if (parsed.data.position !== undefined) patch.position = parsed.data.position;

  const { error } = await supabase
    .from("app_tasks")
    .update(patch)
    .eq("id", taskId)
    .eq("project_id", projectId);
  if (error) return fail("unknown", error.message);

  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true };
}

export async function deleteTaskAction(
  projectId: string,
  taskId: string,
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;
  const supabase = await createClient();
  const { error } = await supabase
    .from("app_tasks")
    .delete()
    .eq("id", taskId)
    .eq("project_id", projectId);
  if (error) return fail("unknown", error.message);
  revalidatePath(`/app/${ctx.project.slug}`, "layout");
  return { ok: true };
}
