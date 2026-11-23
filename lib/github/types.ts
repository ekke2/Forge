/**
 * Provider-agnostic GitHub DTOs.
 *
 * Both the mock source and the real Octokit source normalise into these shapes
 * so the sync engine never sees vendor-specific payloads.
 */

export interface GitHubActor {
  login: string;
  avatar_url: string;
}

export interface GitHubLabel {
  name: string;
  color: string; // hex, no leading '#'
}

export interface GitHubRepo {
  github_id: number;
  owner: string;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  html_url: string;
  open_issues_count: number;
  stargazers_count: number;
  pushed_at: string;
}

export interface GitHubIssue {
  github_id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  state_reason: string | null;
  author: GitHubActor | null;
  assignees: GitHubActor[];
  labels: GitHubLabel[];
  comments_count: number;
  milestone_title: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface GitHubPull {
  github_id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed" | "merged";
  draft: boolean;
  author: GitHubActor | null;
  base_ref: string;
  head_ref: string;
  additions: number;
  deletions: number;
  changed_files: number;
  commits_count: number;
  comments_count: number;
  review_decision:
    | "approved"
    | "changes_requested"
    | "review_required"
    | null;
  ci_state: "success" | "failure" | "pending" | "unknown" | null;
  requested_reviewers: GitHubActor[];
  labels: GitHubLabel[];
  linked_issue_number: number | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
}

export interface GitHubReview {
  github_id: number;
  pr_number: number;
  reviewer: GitHubActor;
  state: "approved" | "changes_requested" | "commented" | "dismissed" | "pending";
  body: string | null;
  submitted_at: string | null;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: GitHubActor | null;
  author_name: string;
  authored_at: string;
  additions: number;
  deletions: number;
  html_url: string;
}

export interface GitHubDiffFile {
  filename: string;
  status: "added" | "modified" | "removed" | "renamed";
  additions: number;
  deletions: number;
  previous_filename?: string;
  /** Unified diff hunk text (no leading `diff --git` header). */
  patch: string;
}

export interface CreateIssueInput {
  title: string;
  body?: string;
  assignees?: string[];
  labels?: string[];
}

export interface UpdateIssueInput {
  title?: string;
  body?: string;
  state?: "open" | "closed";
  assignees?: string[];
  labels?: string[];
}

export interface RepoSummaryForConnect {
  github_id: number;
  full_name: string;
  owner: string;
  name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  updated_at: string;
  language: string | null;
}

export interface GitHubSource {
  /** Repositories the user could connect (connect wizard). */
  listConnectableRepos(): Promise<RepoSummaryForConnect[]>;
  getRepo(): Promise<GitHubRepo>;
  listIssues(): Promise<GitHubIssue[]>;
  listPulls(): Promise<GitHubPull[]>;
  listReviews(): Promise<GitHubReview[]>;
  listCommits(): Promise<GitHubCommit[]>;
  getPullDiff(prNumber: number): Promise<GitHubDiffFile[]>;
  createIssue(input: CreateIssueInput): Promise<GitHubIssue>;
  updateIssue(number: number, input: UpdateIssueInput): Promise<GitHubIssue>;
}
