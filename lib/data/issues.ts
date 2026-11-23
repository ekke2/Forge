import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import {
  deriveWorkflowStatus,
  type WorkflowStatus,
  type TaskPriority,
} from "@/lib/workflow";

type IssueCacheRow = Database["public"]["Tables"]["issues_cache"]["Row"];
type PrCacheRow = Database["public"]["Tables"]["pull_requests_cache"]["Row"];

export interface Assignee {
  login: string;
  avatar_url: string;
}
export interface Label {
  name: string;
  color: string;
}

export interface IssueView {
  number: number;
  title: string;
  body: string | null;
  githubState: "open" | "closed";
  stateReason: string | null;
  author: Assignee | null;
  assignees: Assignee[];
  labels: Label[];
  commentsCount: number;
  htmlUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  closedAt: string | null;
  milestone: string | null;
  /** Forge-owned workflow overlay. */
  workflowStatus: WorkflowStatus;
  priority: TaskPriority;
  position: number;
  hasExplicitWorkflow: boolean;
  linkedPr: { number: number; state: string; title: string } | null;
}

function toView(
  issue: IssueCacheRow,
  workflow:
    | Database["public"]["Tables"]["issue_workflow"]["Row"]
    | undefined,
  linkedPr: IssueView["linkedPr"],
): IssueView {
  const githubState = issue.state;
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body,
    githubState,
    stateReason: issue.state_reason,
    author: issue.author_login
      ? { login: issue.author_login, avatar_url: issue.author_avatar_url ?? "" }
      : null,
    assignees: (issue.assignees as unknown as Assignee[]) ?? [],
    labels: (issue.labels as unknown as Label[]) ?? [],
    commentsCount: issue.comments_count,
    htmlUrl: issue.html_url,
    createdAt: issue.github_created_at,
    updatedAt: issue.github_updated_at,
    closedAt: issue.github_closed_at,
    milestone: issue.milestone_title,
    workflowStatus:
      workflow?.status ??
      deriveWorkflowStatus(githubState, linkedPr?.state === "open"),
    priority: workflow?.priority ?? "none",
    position: workflow?.position ?? issue.number,
    hasExplicitWorkflow: Boolean(workflow),
    linkedPr,
  };
}

async function loadLinkedPrs(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pull_requests_cache")
    .select("number, title, state, linked_issue_number")
    .eq("project_id", projectId)
    .not("linked_issue_number", "is", null);
  const map = new Map<number, IssueView["linkedPr"]>();
  for (const pr of (data ?? []) as Pick<
    PrCacheRow,
    "number" | "title" | "state" | "linked_issue_number"
  >[]) {
    if (pr.linked_issue_number == null) continue;
    const existing = map.get(pr.linked_issue_number);
    // Prefer an open PR as the "linked development" pointer.
    if (!existing || pr.state === "open") {
      map.set(pr.linked_issue_number, {
        number: pr.number,
        state: pr.state,
        title: pr.title,
      });
    }
  }
  return map;
}

export interface ListIssuesOptions {
  state?: "open" | "closed" | "all";
  assignee?: string;
  label?: string;
  search?: string;
}

export async function listIssues(
  projectId: string,
  opts: ListIssuesOptions = {},
): Promise<IssueView[]> {
  const supabase = await createClient();
  let query = supabase
    .from("issues_cache")
    .select("*")
    .eq("project_id", projectId);

  if (opts.state && opts.state !== "all") query = query.eq("state", opts.state);
  if (opts.search) query = query.ilike("title", `%${opts.search}%`);

  const { data: issues } = await query.order("number", { ascending: false });

  const { data: workflows } = await supabase
    .from("issue_workflow")
    .select("*")
    .eq("project_id", projectId);
  const wfMap = new Map(
    (workflows ?? []).map((w) => [w.issue_number, w] as const),
  );

  const linkedPrs = await loadLinkedPrs(projectId);

  let views = (issues ?? []).map((i) =>
    toView(i, wfMap.get(i.number), linkedPrs.get(i.number) ?? null),
  );

  if (opts.assignee) {
    views = views.filter((v) =>
      v.assignees.some((a) => a.login === opts.assignee),
    );
  }
  if (opts.label) {
    views = views.filter((v) => v.labels.some((l) => l.name === opts.label));
  }
  return views;
}

export async function getIssue(
  projectId: string,
  number: number,
): Promise<IssueView | null> {
  const supabase = await createClient();
  const { data: issue } = await supabase
    .from("issues_cache")
    .select("*")
    .eq("project_id", projectId)
    .eq("number", number)
    .maybeSingle();
  if (!issue) return null;

  const { data: workflow } = await supabase
    .from("issue_workflow")
    .select("*")
    .eq("project_id", projectId)
    .eq("issue_number", number)
    .maybeSingle();

  const linkedPrs = await loadLinkedPrs(projectId);
  return toView(issue, workflow ?? undefined, linkedPrs.get(number) ?? null);
}

export interface BoardColumn {
  status: WorkflowStatus;
  issues: IssueView[];
}

export async function getBoard(projectId: string): Promise<BoardColumn[]> {
  const issues = await listIssues(projectId, { state: "all" });
  const columns: Record<WorkflowStatus, IssueView[]> = {
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  };
  for (const issue of issues) columns[issue.workflowStatus].push(issue);
  for (const key of Object.keys(columns) as WorkflowStatus[]) {
    columns[key].sort((a, b) => a.position - b.position || b.number - a.number);
  }
  return (Object.keys(columns) as WorkflowStatus[]).map((status) => ({
    status,
    issues: columns[status],
  }));
}

/** Distinct labels seen across the project's cached issues. */
export async function listLabels(projectId: string): Promise<Label[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("issues_cache")
    .select("labels")
    .eq("project_id", projectId);
  const seen = new Map<string, Label>();
  for (const row of data ?? []) {
    for (const label of (row.labels as unknown as Label[]) ?? []) {
      if (!seen.has(label.name)) seen.set(label.name, label);
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}
