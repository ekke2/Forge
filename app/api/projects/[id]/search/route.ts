import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Lightweight search for the command palette. RLS scopes results to members. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ issues: [], pulls: [] });

  const supabase = await createClient();
  const like = `%${q}%`;

  const [issues, pulls] = await Promise.all([
    supabase
      .from("issues_cache")
      .select("number, title, state")
      .eq("project_id", id)
      .ilike("title", like)
      .order("github_updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("pull_requests_cache")
      .select("number, title, state")
      .eq("project_id", id)
      .ilike("title", like)
      .order("github_updated_at", { ascending: false })
      .limit(6),
  ]);

  return NextResponse.json({
    issues: issues.data ?? [],
    pulls: pulls.data ?? [],
  });
}
