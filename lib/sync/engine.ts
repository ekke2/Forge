import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGitHubSource } from "@/lib/github/source";
import type { Database } from "@/lib/database.types";
import type {
  GitHubCommit,
  GitHubIssue,
  GitHubPull,
  GitHubReview,
} from "@/lib/github/types";
import { toJson } from "@/lib/json";

type Trigger = Database["public"]["Enums"]["sync_trigger"];

export interface SyncStats {
  issues: number;
  pulls: number;
  commits: number;
  reviews: number;
}

export interface SyncResult {
  ok: boolean;
  runId: string;
  stats?: SyncStats;
  error?: string;
  durationMs: number;
}

/**
 * The one and only path by which GitHub-owned data enters Postgres.
 *
 *   user action → this function (server) → GitHub source → success →
 *   write *_cache tables (service role) → UI reads cache
 *
 * We never write a cache row speculatively; every row here reflects a value the
 * source actually returned. See Instructions §21.
 */
export async function runSync(params: {
  projectId: string;
  trigger?: Trigger;
  viewerLogin?: string | null;
}): Promise<SyncResult> {
  const { projectId, trigger = "manual", viewerLogin } = params;
  const admin = createAdminClient();
  const startedAt = Date.now();

  const { data: project, error: projErr } = await admin
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (projErr || !project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const { data: run, error: runErr } = await admin
    .from("sync_runs")
    .insert({ project_id: projectId, trigger, status: "running" })
    .select("id")
    .single();
  if (runErr || !run) throw new Error("Could not open a sync run");

  await admin
    .from("projects")
    .update({ sync_status: "syncing", sync_error: null })
    .eq("id", projectId);

  try {
    const source = getGitHubSource({ project, admin, viewerLogin });

    const [repo, issues, pulls, reviews, commits] = await Promise.all([
      source.getRepo(),
      source.listIssues(),
      source.listPulls(),
      source.listReviews(),
      source.listCommits(),
    ]);

    await upsertIssues(admin, projectId, issues);
    await upsertPulls(admin, projectId, pulls);
    await upsertReviews(admin, projectId, reviews);
    await upsertCommits(admin, projectId, commits);
    await rebuildContributionStats(admin, projectId, {
      issues,
      pulls,
      reviews,
      commits,
    });
    await rebuildActivity(admin, projectId, { issues, pulls, commits });

    await admin
      .from("projects")
      .update({
        repo_github_id: repo.github_id,
        repo_url: repo.html_url,
        default_branch: repo.default_branch,
        is_private: repo.private,
        description: project.description ?? repo.description,
        last_synced_at: new Date().toISOString(),
        sync_status: "idle",
        sync_error: null,
      })
      .eq("id", projectId);

    const stats: SyncStats = {
      issues: issues.length,
      pulls: pulls.length,
      commits: commits.length,
      reviews: reviews.length,
    };
    const durationMs = Date.now() - startedAt;

    await admin
      .from("sync_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        duration_ms: durationMs,
        stats: toJson(stats),
      })
      .eq("id", run.id);

    return { ok: true, runId: run.id, stats, durationMs };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sync error";
    const durationMs = Date.now() - startedAt;
    await admin
      .from("sync_runs")
      .update({
        status: "error",
        finished_at: new Date().toISOString(),
        duration_ms: durationMs,
        error: message,
      })
      .eq("id", run.id);
    await admin
      .from("projects")
      .update({ sync_status: "error", sync_error: message })
      .eq("id", projectId);
    return { ok: false, runId: run.id, error: message, durationMs };
  }
}

/* -------------------------------------------------------------------------- */
/* Cache writers (service role only)                                        */
/* -------------------------------------------------------------------------- */

type Admin = ReturnType<typeof createAdminClient>;

async function upsertIssues(
  admin: Admin,
  projectId: string,
  issues: GitHubIssue[],
) {
  const rows = issues.map((i) => ({
    project_id: projectId,
    github_id: i.github_id,
    number: i.number,
    title: i.title,
    body: i.body,
    state: i.state,
    state_reason: i.state_reason,
    author_login: i.author?.login ?? null,
    author_avatar_url: i.author?.avatar_url ?? null,
    assignees: toJson(i.assignees),
    labels: toJson(i.labels),
    comments_count: i.comments_count,
    milestone_title: i.milestone_title,
    html_url: i.html_url,
    github_created_at: i.created_at,
    github_updated_at: i.updated_at,
    github_closed_at: i.closed_at,
    synced_at: new Date().toISOString(),
  }));
  if (rows.length) {
    await admin.from("issues_cache").upsert(rows, { onConflict: "project_id,number" });
  }
  await pruneStale(admin, "issues_cache", projectId, issues.map((i) => i.number));
}

async function upsertPulls(
  admin: Admin,
  projectId: string,
  pulls: GitHubPull[],
) {
  const rows = pulls.map((p) => ({
    project_id: projectId,
    github_id: p.github_id,
    number: p.number,
    title: p.title,
    body: p.body,
    state: p.state,
    draft: p.draft,
    author_login: p.author?.login ?? null,
    author_avatar_url: p.author?.avatar_url ?? null,
    base_ref: p.base_ref,
    head_ref: p.head_ref,
    additions: p.additions,
    deletions: p.deletions,
    changed_files: p.changed_files,
    commits_count: p.commits_count,
    comments_count: p.comments_count,
    review_decision: p.review_decision,
    ci_state: p.ci_state,
    requested_reviewers: toJson(p.requested_reviewers),
    labels: toJson(p.labels),
    linked_issue_number: p.linked_issue_number,
    html_url: p.html_url,
    github_created_at: p.created_at,
    github_updated_at: p.updated_at,
    github_merged_at: p.merged_at,
    synced_at: new Date().toISOString(),
  }));
  if (rows.length) {
    await admin
      .from("pull_requests_cache")
      .upsert(rows, { onConflict: "project_id,number" });
  }
  await pruneStale(
    admin,
    "pull_requests_cache",
    projectId,
    pulls.map((p) => p.number),
  );
}

async function upsertReviews(
  admin: Admin,
  projectId: string,
  reviews: GitHubReview[],
) {
  if (!reviews.length) return;
  const rows = reviews.map((r) => ({
    project_id: projectId,
    pr_number: r.pr_number,
    github_id: r.github_id,
    reviewer_login: r.reviewer.login,
    reviewer_avatar_url: r.reviewer.avatar_url,
    state: r.state,
    body: r.body,
    submitted_at: r.submitted_at,
    synced_at: new Date().toISOString(),
  }));
  await admin.from("pr_reviews").upsert(rows, { onConflict: "project_id,github_id" });
}

async function upsertCommits(
  admin: Admin,
  projectId: string,
  commits: GitHubCommit[],
) {
  if (!commits.length) return;
  const rows = commits.map((c) => ({
    project_id: projectId,
    sha: c.sha,
    message: c.message,
    author_login: c.author?.login ?? null,
    author_name: c.author_name,
    author_avatar_url: c.author?.avatar_url ?? null,
    authored_at: c.authored_at,
    additions: c.additions,
    deletions: c.deletions,
    html_url: c.html_url,
    synced_at: new Date().toISOString(),
  }));
  await admin.from("commits_cache").upsert(rows, { onConflict: "project_id,sha" });
}

async function pruneStale(
  admin: Admin,
  table: "issues_cache" | "pull_requests_cache",
  projectId: string,
  seenNumbers: number[],
) {
  // An object that vanished from GitHub is removed from our mirror. Forge-owned
  // rows keyed on the same number (issue_workflow) are left intact and simply
  // stop resolving — handled gracefully in the UI.
  const list = seenNumbers.length ? seenNumbers.join(",") : "0";
  await admin
    .from(table)
    .delete()
    .eq("project_id", projectId)
    .not("number", "in", `(${list})`);
}

async function rebuildContributionStats(
  admin: Admin,
  projectId: string,
  data: {
    issues: GitHubIssue[];
    pulls: GitHubPull[];
    reviews: GitHubReview[];
    commits: GitHubCommit[];
  },
) {
  const acc = new Map<
    string,
    {
      avatar: string;
      commits: number;
      prs_opened: number;
      prs_merged: number;
      issues_closed: number;
      reviews: number;
    }
  >();
  const bump = (login: string | undefined, avatar: string | undefined) => {
    if (!login) return null;
    if (!acc.has(login)) {
      acc.set(login, {
        avatar: avatar ?? "",
        commits: 0,
        prs_opened: 0,
        prs_merged: 0,
        issues_closed: 0,
        reviews: 0,
      });
    }
    return acc.get(login)!;
  };

  for (const c of data.commits) {
    const e = bump(c.author?.login, c.author?.avatar_url);
    if (e) e.commits += 1;
  }
  for (const p of data.pulls) {
    const e = bump(p.author?.login, p.author?.avatar_url);
    if (e) {
      e.prs_opened += 1;
      if (p.state === "merged") e.prs_merged += 1;
    }
  }
  for (const i of data.issues) {
    if (i.state === "closed") {
      const e = bump(i.author?.login, i.author?.avatar_url);
      if (e) e.issues_closed += 1;
    }
  }
  for (const r of data.reviews) {
    const e = bump(r.reviewer.login, r.reviewer.avatar_url);
    if (e) e.reviews += 1;
  }

  await admin
    .from("contribution_stats_cache")
    .delete()
    .eq("project_id", projectId)
    .eq("period", "all");

  const rows = [...acc.entries()].map(([login, v]) => ({
    project_id: projectId,
    member_login: login,
    member_avatar_url: v.avatar,
    period: "all",
    commits: v.commits,
    prs_opened: v.prs_opened,
    prs_merged: v.prs_merged,
    issues_closed: v.issues_closed,
    reviews: v.reviews,
    synced_at: new Date().toISOString(),
  }));
  if (rows.length) await admin.from("contribution_stats_cache").insert(rows);
}

async function rebuildActivity(
  admin: Admin,
  projectId: string,
  data: { issues: GitHubIssue[]; pulls: GitHubPull[]; commits: GitHubCommit[] },
) {
  type Row = Database["public"]["Tables"]["activity"]["Insert"];
  const rows: Row[] = [];

  for (const i of data.issues) {
    rows.push({
      project_id: projectId,
      source: "github",
      actor_login: i.author?.login ?? null,
      actor_avatar_url: i.author?.avatar_url ?? null,
      verb: "opened",
      object_type: "issue",
      object_ref: `#${i.number}`,
      title: i.title,
      summary: `${i.author?.login ?? "someone"} opened issue #${i.number}`,
      url: i.html_url,
      occurred_at: i.created_at,
      dedupe_key: `issue-opened-${i.number}`,
    });
    if (i.state === "closed" && i.closed_at) {
      rows.push({
        project_id: projectId,
        source: "github",
        actor_login: i.author?.login ?? null,
        actor_avatar_url: i.author?.avatar_url ?? null,
        verb: "closed",
        object_type: "issue",
        object_ref: `#${i.number}`,
        title: i.title,
        summary: `Issue #${i.number} was closed`,
        url: i.html_url,
        occurred_at: i.closed_at,
        dedupe_key: `issue-closed-${i.number}`,
      });
    }
  }

  for (const p of data.pulls) {
    rows.push({
      project_id: projectId,
      source: "github",
      actor_login: p.author?.login ?? null,
      actor_avatar_url: p.author?.avatar_url ?? null,
      verb: "opened",
      object_type: "pull_request",
      object_ref: `#${p.number}`,
      title: p.title,
      summary: `${p.author?.login ?? "someone"} opened PR #${p.number}`,
      url: p.html_url,
      occurred_at: p.created_at,
      dedupe_key: `pr-opened-${p.number}`,
    });
    if (p.state === "merged" && p.merged_at) {
      rows.push({
        project_id: projectId,
        source: "github",
        actor_login: p.author?.login ?? null,
        actor_avatar_url: p.author?.avatar_url ?? null,
        verb: "merged",
        object_type: "pull_request",
        object_ref: `#${p.number}`,
        title: p.title,
        summary: `PR #${p.number} was merged`,
        url: p.html_url,
        occurred_at: p.merged_at,
        dedupe_key: `pr-merged-${p.number}`,
      });
    }
  }

  for (const c of data.commits.slice(0, 30)) {
    rows.push({
      project_id: projectId,
      source: "github",
      actor_login: c.author?.login ?? null,
      actor_avatar_url: c.author?.avatar_url ?? null,
      verb: "pushed",
      object_type: "commit",
      object_ref: c.sha.slice(0, 7),
      title: c.message.split("\n")[0],
      summary: `${c.author?.login ?? c.author_name} committed ${c.sha.slice(0, 7)}`,
      url: c.html_url,
      occurred_at: c.authored_at,
      dedupe_key: `commit-${c.sha.slice(0, 12)}`,
    });
  }

  // Keep the feed bounded and fresh.
  rows.sort((a, b) =>
    String(b.occurred_at).localeCompare(String(a.occurred_at)),
  );
  const bounded = rows.slice(0, 60);
  if (bounded.length) {
    await admin
      .from("activity")
      .upsert(bounded, { onConflict: "project_id,dedupe_key" });
  }
}
