import { NextResponse, type NextRequest } from "next/server";
import { runSync } from "@/lib/sync/engine";
import { loadMemberContext, isActionError } from "@/lib/actions/util";

/**
 * Manual "Sync now". Server-side only — the browser never talks to GitHub
 * directly. Membership is verified before the sync runs.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await loadMemberContext(id);
  if (isActionError(ctx)) {
    const status =
      ctx.error === "unauthenticated" ? 401 : ctx.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: ctx.message }, { status });
  }

  const result = await runSync({
    projectId: id,
    trigger: "manual",
    viewerLogin: ctx.user.profile?.github_username ?? null,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
