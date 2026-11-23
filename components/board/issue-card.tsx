import Link from "next/link";
import { GitPullRequest, MessageSquare } from "lucide-react";
import { AssigneeAvatars } from "@/components/assignee-avatars";
import { LabelPill } from "@/components/label-pill";
import { PriorityBadge } from "@/components/priority-badge";
import { RelativeTime } from "@/components/relative-time";
import { cn } from "@/lib/utils";
import type { IssueView } from "@/lib/data/issues";

export function IssueCard({
  issue,
  href,
  dragging,
  className,
}: {
  issue: IssueView;
  href?: string;
  dragging?: boolean;
  className?: string;
}) {
  const inner = (
    <div
      className={cn(
        "rounded-md border border-border bg-card p-2.5 text-left shadow-sm transition-colors",
        dragging ? "opacity-40" : "hover:border-border hover:bg-hover",
        issue.githubState === "closed" && "opacity-70",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <PriorityBadge priority={issue.priority} />
        <span className="font-mono text-2xs text-muted-foreground">
          #{issue.number}
        </span>
        {issue.linkedPr && (
          <span className="inline-flex items-center gap-0.5 font-mono text-2xs text-success">
            <GitPullRequest className="h-3 w-3" />
            {issue.linkedPr.number}
          </span>
        )}
        <span className="ml-auto text-2xs text-muted-foreground">
          <RelativeTime value={issue.updatedAt} />
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-medium text-foreground">
        {issue.title}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <div className="flex flex-wrap gap-1">
          {issue.labels.slice(0, 3).map((l) => (
            <LabelPill key={l.name} name={l.name} color={l.color} />
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {issue.commentsCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-2xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {issue.commentsCount}
            </span>
          )}
          <AssigneeAvatars people={issue.assignees} size={16} max={2} />
        </div>
      </div>
    </div>
  );

  if (href && !dragging) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
