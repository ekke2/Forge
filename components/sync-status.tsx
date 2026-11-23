"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CircleAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SyncStatus({
  projectId,
  lastSyncedAt,
  status,
  error,
  compact = false,
}: {
  projectId: string;
  lastSyncedAt: string | null;
  status: "idle" | "syncing" | "error";
  error?: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sync`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        toast.error("Sync failed", { description: body.error ?? undefined });
      } else {
        const s = body.stats;
        toast.success("Synced with GitHub", {
          description: s
            ? `${s.issues} issues · ${s.pulls} PRs · ${s.commits} commits`
            : undefined,
        });
        startTransition(() => router.refresh());
      }
    } catch {
      toast.error("Sync failed", {
        description: "GitHub isn't responding. Cached data is still available.",
      });
    } finally {
      setBusy(false);
    }
  }

  const isSyncing = busy || pending || status === "syncing";

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {!compact && (
        <span className="flex items-center gap-1.5">
          {status === "error" ? (
            <CircleAlert className="h-3.5 w-3.5 text-destructive" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          )}
          {status === "error" ? (
            <span className="text-destructive">
              Last sync failed{" "}
              {lastSyncedAt ? `· data from ${relativeTime(lastSyncedAt)}` : ""}
            </span>
          ) : (
            <span>Last synced {relativeTime(lastSyncedAt)}</span>
          )}
        </span>
      )}
      <Button
        variant="outline"
        size="xs"
        onClick={sync}
        disabled={isSyncing}
        className="gap-1.5"
      >
        <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
        {isSyncing ? "Syncing…" : "Sync now"}
      </Button>
      {status === "error" && error && !compact && (
        <span className="hidden font-mono text-2xs text-muted-foreground/60 md:inline">
          {error.slice(0, 80)}
        </span>
      )}
    </div>
  );
}
