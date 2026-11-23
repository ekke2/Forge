import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WorkloadEntry } from "@/lib/data/overview";

export function WorkloadTable({ entries }: { entries: WorkloadEntry[] }) {
  const withWork = entries.filter(
    (e) => e.openIssues > 0 || e.reviewRequests > 0,
  );
  if (withWork.length === 0) {
    return (
      <EmptyState
        title="Balanced"
        description="No one has open assignments or pending reviews right now."
      />
    );
  }
  const max = Math.max(...withWork.map((e) => e.openIssues), 1);

  return (
    <div className="space-y-2">
      {withWork.map((e) => (
        <div
          key={e.login || e.name}
          className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
        >
          <Avatar className="h-6 w-6">
            {e.avatarUrl && <AvatarImage src={e.avatarUrl} alt="" />}
            <AvatarFallback>{initials(e.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{e.name}</p>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full bg-primary")}
                style={{ width: `${(e.openIssues / max) * 100}%` }}
              />
            </div>
          </div>
          <div className="shrink-0 text-right text-2xs text-muted-foreground">
            <span className="tabular-nums">{e.openIssues}</span> open
            {e.reviewRequests > 0 && (
              <>
                <br />
                <span className="tabular-nums text-warning">
                  {e.reviewRequests}
                </span>{" "}
                to review
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
