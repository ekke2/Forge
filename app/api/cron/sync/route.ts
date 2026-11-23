import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runSync } from "@/lib/sync/engine";
import { SYNC_STALE_AFTER_MS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled refresh (Instructions §22). Triggered by a Supabase pg_cron job
 * (see supabase/migrations) rather than vercel.json, since Vercel's Hobby
 * plan only permits once-daily crons. Called with `Authorization: Bearer
 * $CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const provided =
    auth?.replace("Bearer ", "") ?? req.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const staleBefore = new Date(Date.now() - SYNC_STALE_AFTER_MS).toISOString();
  const { data: projects } = await admin
    .from("projects")
    .select("id, repo_full_name, last_synced_at")
    .or(`last_synced_at.is.null,last_synced_at.lt.${staleBefore}`)
    .limit(25);

  const results: { project: string; ok: boolean; error?: string }[] = [];
  for (const project of projects ?? []) {
    try {
      const r = await runSync({ projectId: project.id, trigger: "scheduled" });
      results.push({ project: project.repo_full_name, ok: r.ok, error: r.error });
    } catch (err) {
      results.push({
        project: project.repo_full_name,
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({ ran: results.length, results });
}
