import Link from "next/link";
import { MessageSquare, GitPullRequest } from "lucide-react";
import { AssigneeAvatars } from "@/components/assignee-avatars";
import { LabelPill } from "@/components/label-pill";
import { PriorityBadge } from "@/components/priority-badge";
import { WorkflowBadge, GitHubStateBadge } from "@/components/status-badge";
import { RelativeTime } from "@/components/relative-time";
import type { IssueView } from "@/lib/data/issues";

export function IssueRow({
  issue,
  href,
}: {
  issue: IssueView;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-hover"
    >
      <PriorityBadge priority={issue.priority} />
      <span className="w-14 shrink-0 font-mono text-2xs text-muted-foreground">
        #{issue.number}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
        {issue.title}
      </span>
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        {issue.labels.slice(0, 2).map((l) => (
          <LabelPill key={l.name} name={l.name} color={l.color} />
        ))}
      </div>
      {issue.linkedPr && (
        <span className="hidden items-center gap-0.5 font-mono text-2xs text-success md:inline-flex">
          <GitPullRequest className="h-3 w-3" />
          {issue.linkedPr.number}
        </span>
      )}
      {issue.commentsCount > 0 && (
        <span className="hidden items-center gap-0.5 text-2xs text-muted-foreground md:inline-flex">
          <MessageSquare className="h-3 w-3" />
          {issue.commentsCount}
        </span>
      )}
      <WorkflowBadge status={issue.workflowStatus} className="hidden lg:flex" />
      <GitHubStateBadge
        state={issue.githubState}
        reason={issue.stateReason}
        className="hidden xl:inline-flex"
      />
      <span className="hidden w-20 shrink-0 text-right text-2xs text-muted-foreground md:block">
        <RelativeTime value={issue.updatedAt} />
      </span>
      <AssigneeAvatars people={issue.assignees} size={18} max={2} />
    </Link>
  );
}
