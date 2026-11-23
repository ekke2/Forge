import Link from "next/link";
import { GitPullRequest, MessageSquare, FileDiff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AssigneeAvatars } from "@/components/assignee-avatars";
import {
  PrStateBadge,
  CiBadge,
  ReviewDecisionBadge,
} from "@/components/status-badge";
import { RelativeTime } from "@/components/relative-time";
import { initials } from "@/lib/format";
import type { PullView } from "@/lib/data/pulls";

export function PullRequestRow({
  pull,
  href,
}: {
  pull: PullView;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-hover"
    >
      <GitPullRequest
        className={
          pull.state === "open"
            ? "mt-0.5 h-4 w-4 shrink-0 text-success"
            : pull.state === "merged"
              ? "mt-0.5 h-4 w-4 shrink-0 text-primary"
              : "mt-0.5 h-4 w-4 shrink-0 text-destructive"
        }
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {pull.title}
          </span>
          <PrStateBadge state={pull.state} draft={pull.draft} />
          <ReviewDecisionBadge decision={pull.reviewDecision} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
          <span className="font-mono">#{pull.number}</span>
          {pull.author && <span>by @{pull.author.login}</span>}
          <span>
            opened <RelativeTime value={pull.createdAt} />
          </span>
          {pull.linkedIssueNumber && (
            <span className="text-primary">closes #{pull.linkedIssueNumber}</span>
          )}
          <span className="inline-flex items-center gap-1">
            <FileDiff className="h-3 w-3" />
            <span className="text-success">+{pull.additions}</span>
            <span className="text-destructive">−{pull.deletions}</span>
          </span>
          {pull.commentsCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {pull.commentsCount}
            </span>
          )}
          <CiBadge state={pull.ciState} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {pull.requestedReviewers.length > 0 && (
          <AssigneeAvatars people={pull.requestedReviewers} size={18} max={2} />
        )}
        {pull.author && (
          <Avatar className="h-5 w-5">
            <AvatarImage src={pull.author.avatar_url} alt="" />
            <AvatarFallback>{initials(pull.author.login)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </Link>
  );
}
