"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { fail, type ActionResult } from "@/lib/actions/util";

const schema = z.object({
  githubUsername: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, {
      message: "That doesn't look like a GitHub username.",
    }),
  displayName: z.string().trim().min(1).max(80).optional(),
});

/**
 * Lets an email-signup user attach a GitHub handle so "assigned to me",
 * workload and contribution views resolve. (A GitHub OAuth sign-in fills this
 * in automatically.)
 */
export async function updateProfileAction(
  input: z.infer<typeof schema>,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("unauthenticated", "Please sign in.");
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return fail("validation", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      github_username: parsed.data.githubUsername,
      display_name: parsed.data.displayName ?? user.profile?.display_name ?? null,
    })
    .eq("id", user.id);
  if (error) return fail("unknown", error.message);

  revalidatePath("/app", "layout");
  return { ok: true };
}
