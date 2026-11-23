import type { Metadata } from "next";
import { GitBranch, Github, RefreshCw } from "lucide-react";
import { requireProjectAccess, canManage } from "@/lib/auth";
import { listProjectMembers } from "@/lib/data/projects";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, PageBody } from "@/components/page-header";
import { GeneralSettings } from "@/components/settings/general-settings";
import { BillingPanel } from "@/components/settings/billing-panel";
import { DangerZone } from "@/components/settings/danger-zone";
import { SyncStatus } from "@/components/sync-status";
import { RelativeTime } from "@/components/relative-time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project: slug } = await params;
  const { project, role } = await requireProjectAccess(slug);
  const manage = canManage(role);
  const supabase = await createClient();

  const [members, runsRes] = await Promise.all([
    listProjectMembers(project.id),
    supabase
      .from("sync_runs")
      .select("*")
      .eq("project_id", project.id)
      .order("started_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <>
      <PageHeader
        title="Settings"
        description={project.repo_full_name}
      />
      <PageBody className="max-w-3xl space-y-6">
        <GeneralSettings
          projectId={project.id}
          name={project.name}
          description={project.description}
          canEdit={manage}
        />

        {/* Repository & sync */}
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Repository &amp; synchronisation
              </h2>
              <p className="text-xs text-muted-foreground">
                GitHub is authoritative. Forge mirrors issues, pull requests and
                commits for speed.
              </p>
            </div>
            <SyncStatus
              projectId={project.id}
              lastSyncedAt={project.last_synced_at}
              status={project.sync_status}
              compact
            />
          </div>

          <dl className="grid gap-3 text-xs sm:grid-cols-2">
            <Row
              icon={Github}
              label="Repository"
              value={project.repo_full_name}
            />
            <Row
              icon={GitBranch}
              label="Default branch"
              value={project.default_branch}
            />
            <Row
              icon={RefreshCw}
              label="Mode"
              value={
                project.github_mode === "live"
                  ? "Live (GitHub API)"
                  : "Mock dataset"
              }
            />
            <Row
              icon={RefreshCw}
              label="Last synced"
              value={
                project.last_synced_at ? (
                  <RelativeTime value={project.last_synced_at} />
                ) : (
                  "never"
                )
              }
            />
          </dl>

          {runsRes.data && runsRes.data.length > 0 && (
            <div>
              <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent sync runs
              </p>
              <ul className="divide-y divide-border rounded-md border border-border text-xs">
                {runsRes.data.map((run) => (
                  <li
                    key={run.id}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        run.status === "success"
                          ? "bg-success"
                          : run.status === "error"
                            ? "bg-destructive"
                            : "bg-warning",
                      )}
                    />
                    <span className="capitalize text-foreground">
                      {run.trigger}
                    </span>
                    <span className="text-muted-foreground">
                      <RelativeTime value={run.started_at} />
                    </span>
                    {run.duration_ms != null && (
                      <span className="text-muted-foreground">
                        {(run.duration_ms / 1000).toFixed(1)}s
                      </span>
                    )}
                    <span className="ml-auto font-mono text-2xs text-muted-foreground">
                      {run.status === "success" && run.stats
                        ? `${(run.stats as Record<string, number>).issues ?? 0}i · ${
                            (run.stats as Record<string, number>).pulls ?? 0
                          }p · ${(run.stats as Record<string, number>).commits ?? 0}c`
                        : run.error
                          ? run.error.slice(0, 40)
                          : run.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-2xs text-muted-foreground">
            Scheduled refresh runs via Vercel Cron hitting{" "}
            <span className="font-mono">/api/cron/sync</span> (guarded by{" "}
            <span className="font-mono">CRON_SECRET</span>).
          </p>
        </div>

        <BillingPanel
          projectId={project.id}
          plan={project.plan}
          memberCount={members.length}
          canManage={manage}
        />

        {role === "owner" && (
          <DangerZone projectId={project.id} projectName={project.name} />
        )}
      </PageBody>
    </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Github;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono text-foreground">{value}</span>
    </div>
  );
}
