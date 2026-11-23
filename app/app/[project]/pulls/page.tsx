import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GitPullRequest } from "lucide-react";
import { requireProjectAccess, getSessionUser } from "@/lib/auth";
import { listPulls, pullsNeedingReview } from "@/lib/data/pulls";
import { PageHeader, PageBody } from "@/components/page-header";
import { PullRequestRow } from "@/components/pulls/pull-request-row";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pull Requests" };

const TABS = [
  { key: "open", label: "Open" },
  { key: "merged", label: "Merged" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
] as const;

export default async function PullsPage({
  params,
  searchParams,
}: {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { project: slug } = await params;
  const { state = "open" } = await searchParams;

  return (
    <>
      <PageHeader
        title="Pull Requests"
        description="Open pull requests, prioritised by what's waiting on you."
      >
        <div className="flex gap-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/app/${slug}/pulls${t.key === "open" ? "" : `?state=${t.key}`}`}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                state === t.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-hover",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </PageHeader>

      <PageBody>
        <Suspense key={state} fallback={<ListSkeleton />}>
          <PullsContent slug={slug} state={state} />
        </Suspense>
      </PageBody>
    </>
  );
}

async function PullsContent({ slug, state }: { slug: string; state: string }) {
  const { project } = await requireProjectAccess(slug);
  const user = await getSessionUser();
  const [pulls, needsReview] = await Promise.all([
    listPulls(project.id, state as "open"),
    pullsNeedingReview(project.id, user?.profile?.github_username ?? null),
  ]);

  if (pulls.length === 0) {
    return (
      <EmptyState
        icon={GitPullRequest}
        title={
          state === "open"
            ? "No open pull requests right now."
            : `No ${state} pull requests.`
        }
        description="When pull requests are synced from GitHub they'll show here."
      />
    );
  }

  const reviewNumbers = new Set(needsReview.map((p) => p.number));
  const rest = pulls.filter((p) => !reviewNumbers.has(p.number));

  return (
    <div className="space-y-8">
      {state === "open" && needsReview.length > 0 && (
        <section>
          <h2 className="mb-2 text-2xs font-medium uppercase tracking-wide text-warning">
            Needs your review · {needsReview.length}
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-warning/40">
            {needsReview.map((pr) => (
              <PullRequestRow
                key={pr.number}
                pull={pr}
                href={`/app/${slug}/pulls/${pr.number}`}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        {state === "open" && needsReview.length > 0 && (
          <h2 className="mb-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
            Everything else · {rest.length}
          </h2>
        )}
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {rest.map((pr) => (
            <PullRequestRow
              key={pr.number}
              pull={pr}
              href={`/app/${slug}/pulls/${pr.number}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
