import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type PrRow = Database["public"]["Tables"]["pull_requests_cache"]["Row"];
type ReviewRow = Database["public"]["Tables"]["pr_reviews"]["Row"];

export interface PullView {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed" | "merged";
  draft: boolean;
  author: { login: string; avatar_url: string } | null;
  baseRef: string | null;
  headRef: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  commentsCount: number;
  reviewDecision: string | null;
  ciState: string | null;
  requestedReviewers: { login: string; avatar_url: string }[];
  labels: { name: string; color: string }[];
  linkedIssueNumber: number | null;
  htmlUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  mergedAt: string | null;
}

function toView(row: PrRow): PullView {
  return {
    number: row.number,
    title: row.title,
    body: row.body,
    state: row.state,
    draft: row.draft,
    author: row.author_login
      ? { login: row.author_login, avatar_url: row.author_avatar_url ?? "" }
      : null,
    baseRef: row.base_ref,
    headRef: row.head_ref,
    additions: row.additions,
    deletions: row.deletions,
    changedFiles: row.changed_files,
    commentsCount: row.comments_count,
    reviewDecision: row.review_decision,
    ciState: row.ci_state,
    requestedReviewers:
      (row.requested_reviewers as unknown as PullView["requestedReviewers"]) ??
      [],
    labels: (row.labels as unknown as PullView["labels"]) ?? [],
    linkedIssueNumber: row.linked_issue_number,
    htmlUrl: row.html_url,
    createdAt: row.github_created_at,
    updatedAt: row.github_updated_at,
    mergedAt: row.github_merged_at,
  };
}

export async function listPulls(
  projectId: string,
  state: "open" | "closed" | "merged" | "all" = "all",
): Promise<PullView[]> {
  const supabase = await createClient();
  let query = supabase
    .from("pull_requests_cache")
    .select("*")
    .eq("project_id", projectId);
  if (state !== "all") query = query.eq("state", state);
  const { data } = await query.order("number", { ascending: false });
  return (data ?? []).map(toView);
}

export async function getPull(
  projectId: string,
  number: number,
): Promise<{ pull: PullView; reviews: ReviewRow[] } | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("pull_requests_cache")
    .select("*")
    .eq("project_id", projectId)
    .eq("number", number)
    .maybeSingle();
  if (!row) return null;
  const { data: reviews } = await supabase
    .from("pr_reviews")
    .select("*")
    .eq("project_id", projectId)
    .eq("pr_number", number)
    .order("submitted_at", { ascending: true });
  return { pull: toView(row), reviews: reviews ?? [] };
}

/** Open PRs whose requested reviewers include `login`. */
export async function pullsNeedingReview(
  projectId: string,
  login: string | null | undefined,
): Promise<PullView[]> {
  if (!login) return [];
  const open = await listPulls(projectId, "open");
  return open.filter((p) =>
    p.requestedReviewers.some((r) => r.login === login),
  );
}
