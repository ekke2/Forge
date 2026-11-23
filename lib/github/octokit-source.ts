import { Octokit } from "@octokit/rest";
import type {
  CreateIssueInput,
  GitHubDiffFile,
  GitHubIssue,
  GitHubPull,
  GitHubReview,
  GitHubCommit,
  GitHubRepo,
  GitHubSource,
  RepoSummaryForConnect,
  UpdateIssueInput,
} from "@/lib/github/types";

interface OctokitCtx {
  token: string;
  repoOwner: string;
  repoName: string;
}

/**
 * Real GitHub source, used when `GITHUB_MODE=live`. The mock source is the
 * default for this build; this class exists so the swap is a one-line change
 * and the sync engine never needs to know which is in play.
 *
 * NOTE: kept intentionally lean — only the calls the sync engine and issue
 * write-path need. The normalisation below mirrors `lib/github/types.ts`.
 */
export class OctokitGitHubSource implements GitHubSource {
  private kit: Octokit;
  constructor(private ctx: OctokitCtx) {
    this.kit = new Octokit({ auth: ctx.token });
  }
  private get repo() {
    return { owner: this.ctx.repoOwner, repo: this.ctx.repoName };
  }

  async listConnectableRepos(): Promise<RepoSummaryForConnect[]> {
    const res = await this.kit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: "updated",
    });
    return res.data.map((r) => ({
      github_id: r.id,
      full_name: r.full_name,
      owner: r.owner.login,
      name: r.name,
      description: r.description,
      private: r.private,
      default_branch: r.default_branch ?? "main",
      updated_at: r.updated_at ?? new Date().toISOString(),
      language: r.language ?? null,
    }));
  }

  async getRepo(): Promise<GitHubRepo> {
    const { data: r } = await this.kit.repos.get(this.repo);
    return {
      github_id: r.id,
      owner: r.owner.login,
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      private: r.private,
      default_branch: r.default_branch,
      html_url: r.html_url,
      open_issues_count: r.open_issues_count,
      stargazers_count: r.stargazers_count,
      pushed_at: r.pushed_at ?? new Date().toISOString(),
    };
  }

  async listIssues(): Promise<GitHubIssue[]> {
    const res = await this.kit.paginate(this.kit.issues.listForRepo, {
      ...this.repo,
      state: "all",
      per_page: 100,
    });
    return res
      .filter((i) => !i.pull_request)
      .map((i) => ({
        github_id: i.id,
        number: i.number,
        title: i.title,
        body: i.body ?? null,
        state: i.state === "closed" ? "closed" : "open",
        state_reason: i.state_reason ?? null,
        author: i.user
          ? { login: i.user.login, avatar_url: i.user.avatar_url }
          : null,
        assignees: (i.assignees ?? []).map((a) => ({
          login: a.login,
          avatar_url: a.avatar_url,
        })),
        labels: (i.labels ?? []).map((l) =>
          typeof l === "string"
            ? { name: l, color: "64748b" }
            : { name: l.name ?? "", color: l.color ?? "64748b" },
        ),
        comments_count: i.comments,
        milestone_title: i.milestone?.title ?? null,
        html_url: i.html_url,
        created_at: i.created_at,
        updated_at: i.updated_at,
        closed_at: i.closed_at,
      }));
  }

  async listPulls(): Promise<GitHubPull[]> {
    const res = await this.kit.paginate(this.kit.pulls.list, {
      ...this.repo,
      state: "all",
      per_page: 100,
    });
    return res.map((p) => ({
      github_id: p.id,
      number: p.number,
      title: p.title,
      body: p.body ?? null,
      state: p.merged_at ? "merged" : p.state === "closed" ? "closed" : "open",
      draft: Boolean(p.draft),
      author: p.user
        ? { login: p.user.login, avatar_url: p.user.avatar_url }
        : null,
      base_ref: p.base.ref,
      head_ref: p.head.ref,
      additions: 0,
      deletions: 0,
      changed_files: 0,
      commits_count: 0,
      comments_count: 0,
      review_decision: null,
      ci_state: "unknown",
      requested_reviewers: (p.requested_reviewers ?? []).map((r) => ({
        login: r.login,
        avatar_url: r.avatar_url,
      })),
      labels: (p.labels ?? []).map((l) => ({
        name: l.name ?? "",
        color: l.color ?? "64748b",
      })),
      linked_issue_number: null,
      html_url: p.html_url,
      created_at: p.created_at,
      updated_at: p.updated_at,
      merged_at: p.merged_at,
    }));
  }

  async listReviews(): Promise<GitHubReview[]> {
    const pulls = await this.kit.paginate(this.kit.pulls.list, {
      ...this.repo,
      state: "all",
      per_page: 50,
    });
    const out: GitHubReview[] = [];
    for (const p of pulls.slice(0, 30)) {
      const reviews = await this.kit.pulls.listReviews({
        ...this.repo,
        pull_number: p.number,
      });
      for (const r of reviews.data) {
        out.push({
          github_id: r.id,
          pr_number: p.number,
          reviewer: r.user
            ? { login: r.user.login, avatar_url: r.user.avatar_url }
            : { login: "unknown", avatar_url: "" },
          state: (r.state?.toLowerCase() as GitHubReview["state"]) ?? "commented",
          body: r.body ?? null,
          submitted_at: r.submitted_at ?? null,
        });
      }
    }
    return out;
  }

  async listCommits(): Promise<GitHubCommit[]> {
    const res = await this.kit.paginate(this.kit.repos.listCommits, {
      ...this.repo,
      per_page: 100,
    });
    return res.slice(0, 150).map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.author
        ? { login: c.author.login, avatar_url: c.author.avatar_url }
        : null,
      author_name: c.commit.author?.name ?? "unknown",
      authored_at: c.commit.author?.date ?? new Date().toISOString(),
      additions: 0,
      deletions: 0,
      html_url: c.html_url,
    }));
  }

  async getPullDiff(prNumber: number): Promise<GitHubDiffFile[]> {
    const res = await this.kit.paginate(this.kit.pulls.listFiles, {
      ...this.repo,
      pull_number: prNumber,
      per_page: 100,
    });
    return res.map((f) => ({
      filename: f.filename,
      status: f.status as GitHubDiffFile["status"],
      additions: f.additions,
      deletions: f.deletions,
      previous_filename: f.previous_filename,
      patch: f.patch ?? "",
    }));
  }

  async createIssue(input: CreateIssueInput): Promise<GitHubIssue> {
    const { data } = await this.kit.issues.create({
      ...this.repo,
      title: input.title,
      body: input.body,
      assignees: input.assignees,
      labels: input.labels,
    });
    return normaliseSingleIssue(data);
  }

  async updateIssue(
    number: number,
    input: UpdateIssueInput,
  ): Promise<GitHubIssue> {
    const { data } = await this.kit.issues.update({
      ...this.repo,
      issue_number: number,
      title: input.title,
      body: input.body,
      state: input.state,
      assignees: input.assignees,
      labels: input.labels,
    });
    return normaliseSingleIssue(data);
  }
}

function normaliseSingleIssue(i: {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  state: string;
  state_reason?: string | null;
  user?: { login: string; avatar_url: string } | null;
  assignees?: { login: string; avatar_url: string }[] | null;
  labels?: (string | { name?: string | null; color?: string | null })[];
  comments: number;
  milestone?: { title: string } | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}): GitHubIssue {
  return {
    github_id: i.id,
    number: i.number,
    title: i.title,
    body: i.body ?? null,
    state: i.state === "closed" ? "closed" : "open",
    state_reason: i.state_reason ?? null,
    author: i.user ? { login: i.user.login, avatar_url: i.user.avatar_url } : null,
    assignees: (i.assignees ?? []).map((a) => ({
      login: a.login,
      avatar_url: a.avatar_url,
    })),
    labels: (i.labels ?? []).map((l) =>
      typeof l === "string"
        ? { name: l, color: "64748b" }
        : { name: l.name ?? "", color: l.color ?? "64748b" },
    ),
    comments_count: i.comments,
    milestone_title: i.milestone?.title ?? null,
    html_url: i.html_url,
    created_at: i.created_at,
    updated_at: i.updated_at,
    closed_at: i.closed_at,
  };
}
