import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getBoard } from "@/lib/data/issues";
import { listPulls } from "@/lib/data/pulls";
import { listProjectMembers } from "@/lib/data/projects";
import type { Database } from "@/lib/database.types";

export interface WorkSummary {
  openIssues: number;
  inProgress: number;
  inReview: number;
  done: number;
}

export interface WorkloadEntry {
  login: string;
  name: string;
  avatarUrl: string;
  openIssues: number;
  reviewRequests: number;
}

export interface OverviewData {
  summary: WorkSummary;
  activity: Database["public"]["Tables"]["activity"]["Row"][];
  recentPulls: Awaited<ReturnType<typeof listPulls>>;
  workload: WorkloadEntry[];
  totalIssues: number;
  totalCommits: number;
}

export async function getOverview(projectId: string): Promise<OverviewData> {
  const supabase = await createClient();

  const [board, pulls, members, activityRes, issueCount, commitCount] =
    await Promise.all([
      getBoard(projectId),
      listPulls(projectId, "all"),
      listProjectMembers(projectId),
      supabase
        .from("activity")
        .select("*")
        .eq("project_id", projectId)
        .order("occurred_at", { ascending: false })
        .limit(12),
      supabase
        .from("issues_cache")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabase
        .from("commits_cache")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId),
    ]);

  const col = (s: string) =>
    board.find((c) => c.status === s)?.issues ?? [];

  const summary: WorkSummary = {
    openIssues: board
      .flatMap((c) => c.issues)
      .filter((i) => i.githubState === "open").length,
    inProgress: col("in_progress").length,
    inReview: col("in_review").length,
    done: col("done").length,
  };

  const openIssuesByAssignee = new Map<string, number>();
  for (const issue of board.flatMap((c) => c.issues)) {
    if (issue.githubState !== "open") continue;
    for (const a of issue.assignees) {
      openIssuesByAssignee.set(
        a.login,
        (openIssuesByAssignee.get(a.login) ?? 0) + 1,
      );
    }
  }
  const reviewByReviewer = new Map<string, number>();
  for (const pr of pulls) {
    if (pr.state !== "open") continue;
    for (const r of pr.requestedReviewers) {
      reviewByReviewer.set(r.login, (reviewByReviewer.get(r.login) ?? 0) + 1);
    }
  }

  const workload: WorkloadEntry[] = members
    .map((m) => {
      const login = m.profile?.github_username ?? "";
      return {
        login,
        name: m.profile?.display_name ?? login ?? "Unknown",
        avatarUrl: m.profile?.avatar_url ?? "",
        openIssues: login ? (openIssuesByAssignee.get(login) ?? 0) : 0,
        reviewRequests: login ? (reviewByReviewer.get(login) ?? 0) : 0,
      };
    })
    .sort((a, b) => b.openIssues - a.openIssues);

  return {
    summary,
    activity: activityRes.data ?? [],
    recentPulls: pulls
      .filter((p) => p.state === "open")
      .slice(0, 6)
      .concat(pulls.filter((p) => p.state !== "open").slice(0, 3))
      .slice(0, 8),
    workload,
    totalIssues: issueCount.count ?? 0,
    totalCommits: commitCount.count ?? 0,
  };
}
