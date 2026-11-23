import type { Database } from "@/lib/database.types";

export type WorkflowStatus = Database["public"]["Enums"]["workflow_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type IssueState = Database["public"]["Enums"]["issue_state"];
export type PrState = Database["public"]["Enums"]["pr_state"];

interface StatusMeta {
  id: WorkflowStatus;
  label: string;
  /** Tailwind text colour token class for the status dot / accent. */
  tone: string;
  dot: string;
}

export const WORKFLOW_STATUSES: StatusMeta[] = [
  { id: "todo", label: "Todo", tone: "text-muted-foreground", dot: "bg-muted-foreground/60" },
  { id: "in_progress", label: "In Progress", tone: "text-primary", dot: "bg-primary" },
  { id: "in_review", label: "In Review", tone: "text-warning", dot: "bg-warning" },
  { id: "done", label: "Done", tone: "text-success", dot: "bg-success" },
];

export const WORKFLOW_STATUS_MAP: Record<WorkflowStatus, StatusMeta> =
  Object.fromEntries(WORKFLOW_STATUSES.map((s) => [s.id, s])) as Record<
    WorkflowStatus,
    StatusMeta
  >;

interface PriorityMeta {
  id: TaskPriority;
  label: string;
  /** 0 = none … 4 = urgent, for sorting. */
  rank: number;
  tone: string;
}

export const PRIORITIES: PriorityMeta[] = [
  { id: "none", label: "No priority", rank: 0, tone: "text-muted-foreground" },
  { id: "low", label: "Low", rank: 1, tone: "text-muted-foreground" },
  { id: "medium", label: "Medium", rank: 2, tone: "text-primary" },
  { id: "high", label: "High", rank: 3, tone: "text-warning" },
  { id: "urgent", label: "Urgent", rank: 4, tone: "text-destructive" },
];

export const PRIORITY_MAP: Record<TaskPriority, PriorityMeta> =
  Object.fromEntries(PRIORITIES.map((p) => [p.id, p])) as Record<
    TaskPriority,
    PriorityMeta
  >;

/**
 * Derives a workflow status for a GitHub issue that has no explicit Forge
 * workflow row yet, so the board is never empty on first sync. GitHub state
 * stays authoritative: a closed issue is always Done.
 */
export function deriveWorkflowStatus(
  issueState: IssueState,
  hasLinkedOpenPr: boolean,
): WorkflowStatus {
  if (issueState === "closed") return "done";
  if (hasLinkedOpenPr) return "in_review";
  return "todo";
}

export function prStatusLabel(pr: {
  state: PrState;
  draft: boolean;
}): { label: string; tone: string } {
  if (pr.state === "merged") return { label: "Merged", tone: "text-primary" };
  if (pr.state === "closed") return { label: "Closed", tone: "text-destructive" };
  if (pr.draft) return { label: "Draft", tone: "text-muted-foreground" };
  return { label: "Open", tone: "text-success" };
}
