"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MESSAGE_CHANNELS } from "@/lib/constants";
import {
  fail,
  isActionError,
  loadMemberContext,
  type ActionResult,
} from "@/lib/actions/util";

const schema = z
  .object({
    body: z.string().min(1, "Say something").max(4000),
    channel: z.enum(MESSAGE_CHANNELS).optional(),
    issueNumber: z.number().int().positive().optional(),
  })
  .refine((v) => v.channel || v.issueNumber, {
    message: "A channel or issue is required.",
  });

export async function postMessageAction(
  projectId: string,
  input: z.infer<typeof schema>,
): Promise<ActionResult> {
  const ctx = await loadMemberContext(projectId);
  if (isActionError(ctx)) return ctx;

  // Messaging is a Team-plan feature.
  if (ctx.project.plan === "free") {
    return fail(
      "upgrade_required",
      "Team messaging is part of the Team plan.",
    );
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return fail("validation", parsed.error.issues[0]?.message ?? "Invalid message");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    project_id: projectId,
    channel: parsed.data.channel ?? null,
    issue_number: parsed.data.issueNumber ?? null,
    author_id: ctx.user.id,
    body: parsed.data.body,
  });
  if (error) return fail("unknown", error.message);

  revalidatePath(`/app/${ctx.project.slug}/messages`);
  if (parsed.data.issueNumber) {
    revalidatePath(
      `/app/${ctx.project.slug}/issues/${parsed.data.issueNumber}`,
    );
  }
  return { ok: true };
}
