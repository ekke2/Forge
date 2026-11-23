import Link from "next/link";
import { CircleDot, ListChecks } from "lucide-react";
import { WorkflowBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { DataOrigin } from "@/components/data-origin";
import { shortDate } from "@/lib/format";
import type { QueueItem } from "@/lib/data/tasks";

export function QueueItemRow({
  item,
  showProject = false,
}: {
  item: QueueItem;
  showProject?: boolean;
}) {
  const Icon = item.kind === "github_issue" ? CircleDot : ListChecks;
  return (
    <Link
      href={item.url ?? "#"}
      className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-hover"
    >
      <PriorityBadge priority={item.priority} />
      <Icon
        className={
          item.kind === "github_issue"
            ? "h-4 w-4 shrink-0 text-muted-foreground"
            : "h-4 w-4 shrink-0 text-primary"
        }
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{item.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-2xs text-muted-foreground">
          {item.ref && <span className="font-mono">{item.ref}</span>}
          {showProject && <span>{item.projectName}</span>}
          {item.dueDate && <span>due {shortDate(item.dueDate)}</span>}
        </p>
      </div>
      <WorkflowBadge status={item.status} className="hidden sm:flex" />
      <DataOrigin
        origin={item.kind === "github_issue" ? "github" : "forge"}
        className="hidden md:inline-flex"
      />
    </Link>
  );
}
