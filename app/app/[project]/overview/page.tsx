import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, GitPullRequest, ExternalLink } from "lucide-react";
import { requireProjectAccess } from "@/lib/auth";
import { getOverview } from "@/lib/data/overview";
import { getLatestSyncRun } from "@/lib/data/projects";
import { PageHeader, PageBody } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { SyncStatus } from "@/components/sync-status";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { PullRequestRow } from "@/components/pulls/pull-request-row";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { WorkloadTable } from "@/components/overview/workload-table";
import { MetricsSkeleton, FeedSkeleton } from "@/components/skeletons";
import { compactNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  return (
    <>
      <OverviewHeader slug={project} />
      <PageBody>
        <Suspense fallback={<OverviewSkeleton />}>
          <OverviewContent slug={project} />
        </Suspense>
      </PageBody>
    </>
  );
}

async function OverviewHeader({ slug }: { slug: string }) {
  const { project } = await requireProjectAccess(slug);
  return (
    <PageHeader
      title={project.name}
      description={
        <a
          href={project.repo_url ?? `https://github.com/${project.repo_full_name}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs hover:text-foreground"
        >
          {project.repo_full_name}
          <ExternalLink className="h-3 w-3" />
        </a>
      }
      actions={
        <>
          <SyncStatus
            projectId={project.id}
            lastSyncedAt={project.last_synced_at}
            status={project.sync_status}
            error={project.sync_error}
          />
          <Button asChild size="sm">
            <Link href={`/app/${slug}/issues/new`}>
              <Plus /> New issue
            </Link>
          </Button>
        </>
      }
    />
  );
}

async function OverviewContent({ slug }: { slug: string }) {
  const { project } = await requireProjectAccess(slug);
  const [data, lastRun] = await Promise.all([
    getOverview(project.id),
    getLatestSyncRun(project.id),
  ]);

  const syncFailed = project.sync_status === "error";
  const noData = data.totalIssues === 0 && data.recentPulls.length === 0;

  return (
    <div className="space-y-10">
      {syncFailed && (
        <ErrorState
          kind="sync_failed"
          detail={project.sync_error}
          action={
            <SyncStatus
              projectId={project.id}
              lastSyncedAt={project.last_synced_at}
              status={project.sync_status}
              compact
            />
          }
        />
      )}

      {noData && !syncFailed ? (
        <EmptyState
          title="Nothing synced yet"
          description="Run a sync to pull issues, pull requests and commits from GitHub into this workspace."
          action={
            <SyncStatus
              projectId={project.id}
              lastSyncedAt={project.last_synced_at}
              status={project.sync_status}
              compact
            />
          }
        />
      ) : (
        <>
          {/* Work summary — typography, not cards (Instructions §11). */}
          <section>
            <h2 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              Work summary
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <Metric label="Open issues" value={data.summary.openIssues} />
              <Metric label="In progress" value={data.summary.inProgress} />
              <Metric label="In review" value={data.summary.inReview} />
              <Metric label="Done" value={data.summary.done} />
            </div>
            <p className="mt-3 text-2xs text-muted-foreground">
              {compactNumber(data.totalIssues)} issues ·{" "}
              {compactNumber(data.totalCommits)} commits cached
              {lastRun?.status === "success" && lastRun.duration_ms
                ? ` · last sync ${(lastRun.duration_ms / 1000).toFixed(1)}s`
                : ""}
            </p>
          </section>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <section>
              <h2 className="mb-3 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                Activity
              </h2>
              <ActivityFeed items={data.activity} projectSlug={slug} />
            </section>

            <div className="space-y-10">
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                    Recent pull requests
                  </h2>
                  <Link
                    href={`/app/${slug}/pulls`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View all
                  </Link>
                </div>
                {data.recentPulls.length === 0 ? (
                  <EmptyState
                    icon={GitPullRequest}
                    title="No open pull requests right now."
                  />
                ) : (
                  <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                    {data.recentPulls.map((pr) => (
                      <PullRequestRow
                        key={pr.number}
                        pull={pr}
                        href={`/app/${slug}/pulls/${pr.number}`}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                  Team workload
                </h2>
                <WorkloadTable entries={data.workload} />
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-10">
      <MetricsSkeleton />
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <FeedSkeleton />
        <FeedSkeleton rows={4} />
      </div>
    </div>
  );
}
