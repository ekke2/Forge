import { NextResponse } from "next/server";
import { getSessionUser, getGitHubToken } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGitHubSourceForUser } from "@/lib/github/source";

/** Repositories the signed-in user can connect (connect wizard). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const source = getGitHubSourceForUser({
      admin: createAdminClient(),
      viewerLogin: user.profile?.github_username ?? null,
      token: await getGitHubToken(),
    });
    const repos = await source.listConnectableRepos();
    return NextResponse.json({ repos });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not load repositories.",
      },
      { status: 502 },
    );
  }
}
