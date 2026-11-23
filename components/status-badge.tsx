import {
  CircleDot,
  CircleCheck,
  GitPullRequest,
  GitPullRequestClosed,
  GitMerge,
  CircleDashed,
  Check,
  X,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WORKFLOW_STATUS_MAP, type WorkflowStatus } from "@/lib/workflow";

export function WorkflowBadge({
  status,
  className,
}: {
  status: WorkflowStatus;
  className?: string;
}) {
  const meta = WORKFLOW_STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        meta.tone,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function GitHubStateBadge({
  state,
  reason,
  className,
}: {
  state: "open" | "closed";
  reason?: string | null;
  className?: string;
}) {
  if (state === "open") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-2xs font-medium text-success",
          className,
        )}
      >
        <CircleDot className="h-3 w-3" /> Open
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-2xs font-medium text-primary",
        className,
      )}
    >
      <CircleCheck className="h-3 w-3" />
      {reason === "not_planned" ? "Closed · not planned" : "Closed"}
    </span>
  );
}

export function PrStateBadge({
  state,
  draft,
  className,
}: {
  state: "open" | "closed" | "merged";
  draft?: boolean;
  className?: string;
}) {
  const config =
    state === "merged"
      ? { icon: GitMerge, label: "Merged", cls: "bg-primary/15 text-primary" }
      : state === "closed"
        ? {
            icon: GitPullRequestClosed,
            label: "Closed",
            cls: "bg-destructive/15 text-destructive",
          }
        : draft
          ? {
              icon: CircleDashed,
              label: "Draft",
              cls: "bg-muted text-muted-foreground",
            }
          : {
              icon: GitPullRequest,
              label: "Open",
              cls: "bg-success/15 text-success",
            };
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium",
        config.cls,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export function CiBadge({ state }: { state?: string | null }) {
  if (!state || state === "unknown") return null;
  const map: Record<string, { icon: typeof Check; cls: string; label: string }> =
    {
      success: { icon: Check, cls: "text-success", label: "Checks passing" },
      failure: { icon: X, cls: "text-destructive", label: "Checks failing" },
      pending: { icon: Clock, cls: "text-warning", label: "Checks running" },
    };
  const c = map[state];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-2xs", c.cls)}
      title={c.label}
    >
      <Icon className="h-3 w-3" />
    </span>
  );
}

export function ReviewDecisionBadge({ decision }: { decision?: string | null }) {
  if (!decision) return null;
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: "Approved", cls: "bg-success/15 text-success" },
    changes_requested: {
      label: "Changes requested",
      cls: "bg-destructive/15 text-destructive",
    },
    review_required: {
      label: "Review required",
      cls: "bg-warning/15 text-warning",
    },
  };
  const c = map[decision];
  if (!c) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium",
        c.cls,
      )}
    >
      {c.label}
    </span>
  );
}
