import Link from "next/link";
import {
  CircleDot,
  CircleCheck,
  GitPullRequest,
  GitMerge,
  GitCommitHorizontal,
  ArrowRightLeft,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/relative-time";
import { EmptyState } from "@/components/empty-state";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityRow } from "@/lib/data/activity";

const ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  "issue:opened": { icon: CircleDot, tone: "text-success" },
  "issue:closed": { icon: CircleCheck, tone: "text-primary" },
  "issue:created": { icon: Sparkles, tone: "text-primary" },
  "pull_request:opened": { icon: GitPullRequest, tone: "text-success" },
  "pull_request:merged": { icon: GitMerge, tone: "text-primary" },
  "commit:pushed": { icon: GitCommitHorizontal, tone: "text-muted-foreground" },
  "workflow:moved": { icon: ArrowRightLeft, tone: "text-warning" },
};

function iconFor(row: ActivityRow) {
  return (
    ICONS[`${row.object_type}:${row.verb}`] ?? {
      icon: Sparkles,
      tone: "text-muted-foreground",
    }
  );
}

export function ActivityFeed({
  items,
  projectSlug,
  emptyHint,
}: {
  items: ActivityRow[];
  projectSlug: string;
  emptyHint?: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No recent activity"
        description={
          emptyHint ??
          "Your project hasn't had any recent activity. Sync to pull the latest from GitHub."
        }
      />
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((row) => {
        const { icon: Icon, tone } = iconFor(row);
        const internalHref = hrefFor(row, projectSlug);
        const body = (
          <div className="flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-hover">
            <div className="relative mt-0.5">
              {row.actor_avatar_url ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={row.actor_avatar_url} alt="" />
                  <AvatarFallback>
                    {initials(row.actor_login ?? "?")}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                  <Icon className={cn("h-3.5 w-3.5", tone)} />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">{row.summary}</span>
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-2xs text-muted-foreground">
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    row.source === "forge" ? "text-primary" : "",
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {row.source === "forge" ? "Forge" : "GitHub"}
                </span>
                <span aria-hidden>·</span>
                <RelativeTime value={row.occurred_at} />
                {row.title && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="truncate">{row.title}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        );
        return (
          <li key={row.id}>
            {internalHref ? (
              <Link href={internalHref}>{body}</Link>
            ) : row.url ? (
              <a href={row.url} target="_blank" rel="noreferrer">
                {body}
              </a>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}

function hrefFor(row: ActivityRow, slug: string): string | null {
  if (!row.object_ref) return null;
  const num = row.object_ref.replace("#", "");
  if (row.object_type === "issue" || row.object_type === "workflow") {
    return `/app/${slug}/issues/${num}`;
  }
  if (row.object_type === "pull_request") {
    return `/app/${slug}/pulls/${num}`;
  }
  return null;
}
