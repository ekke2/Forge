import { AlertTriangle, WifiOff, ShieldAlert, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "generic" | "github_down" | "permission" | "rate_limited" | "sync_failed";

const CONFIG: Record<
  Kind,
  { icon: typeof AlertTriangle; title: string; body: string }
> = {
  generic: {
    icon: AlertTriangle,
    title: "Something went wrong",
    body: "An unexpected error occurred. Try again in a moment.",
  },
  github_down: {
    icon: WifiOff,
    title: "GitHub isn't responding right now",
    body: "Your cached project data is still available. We'll retry automatically.",
  },
  permission: {
    icon: ShieldAlert,
    title: "Forge no longer has permission to access this repository",
    body: "Reconnect GitHub to restore synchronisation.",
  },
  rate_limited: {
    icon: Timer,
    title: "GitHub API rate limit reached",
    body: "Some information may be temporarily stale. This clears on its own shortly.",
  },
  sync_failed: {
    icon: AlertTriangle,
    title: "The last sync failed",
    body: "Cached data is shown below. Retry when you're ready.",
  },
};

export function ErrorState({
  kind = "generic",
  detail,
  action,
  className,
}: {
  kind?: Kind;
  detail?: string | null;
  action?: React.ReactNode;
  className?: string;
}) {
  const c = CONFIG[kind];
  const Icon = c.icon;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15 text-warning">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-foreground">{c.title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{c.body}</p>
      {detail && (
        <p className="mt-2 max-w-md font-mono text-2xs text-muted-foreground/70">
          {detail}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
