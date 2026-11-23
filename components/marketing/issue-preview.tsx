import { GitPullRequest, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const COLUMNS = [
  {
    name: "In Progress",
    dot: "bg-primary",
    cards: [
      { n: 142, t: "Fix authentication redirect", labels: ["bug"], pr: 87 },
      { n: 156, t: "Update onboarding copy", labels: ["docs"] },
    ],
  },
  {
    name: "In Review",
    dot: "bg-warning",
    cards: [
      { n: 138, t: "Implement billing settings", labels: ["feature"], pr: 91 },
    ],
  },
  {
    name: "Done",
    dot: "bg-success",
    cards: [
      { n: 129, t: "Cache GitHub commits locally", labels: ["perf"] },
      { n: 121, t: "Add RLS regression tests", labels: ["security"] },
    ],
  },
];

const LABEL_TONE: Record<string, string> = {
  bug: "bg-destructive/15 text-destructive",
  feature: "bg-primary/15 text-primary",
  docs: "bg-muted text-muted-foreground",
  perf: "bg-warning/15 text-warning",
  security: "bg-primary/15 text-primary",
};

export function MarketingIssuePreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </div>
        <span className="ml-2 font-mono text-2xs text-muted-foreground">
          acme/orbit · board
        </span>
        <span className="ml-auto rounded border border-border px-1.5 py-0.5 font-mono text-2xs text-muted-foreground">
          ⌘K
        </span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col.name} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", col.dot)} />
              {col.name}
              <span className="ml-auto text-muted-foreground/60">
                {col.cards.length}
              </span>
            </div>
            {col.cards.map((card) => (
              <div
                key={card.n}
                className="rounded-md border border-border bg-background p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-2xs text-muted-foreground">
                    #{card.n}
                  </span>
                  {card.pr && (
                    <span className="inline-flex items-center gap-0.5 font-mono text-2xs text-success">
                      <GitPullRequest className="h-3 w-3" />
                      {card.pr}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium text-foreground">
                  {card.t}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  {card.labels.map((l) => (
                    <span
                      key={l}
                      className={cn(
                        "rounded px-1 py-0.5 text-[10px] font-medium",
                        LABEL_TONE[l] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {l}
                    </span>
                  ))}
                  <MessageSquare className="ml-auto h-3 w-3 text-muted-foreground/50" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
