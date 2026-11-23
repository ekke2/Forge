import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, GitBranch, FileDiff } from "lucide-react";
import { requireProjectAccess, getSessionUser } from "@/lib/auth";
import { getPull } from "@/lib/data/pulls";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGitHubSource } from "@/lib/github/source";
import type { GitHubDiffFile } from "@/lib/github/types";
import { PageBody } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LabelPill } from "@/components/label-pill";
import {
  PrStateBadge,
  CiBadge,
  ReviewDecisionBadge,
} from "@/components/status-badge";
import { RelativeTime } from "@/components/relative-time";
import { DataOrigin } from "@/components/data-origin";
import { DiffViewer } from "@/components/pulls/diff-viewer";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  return { title: `PR #${number}` };
}

export default async function PullDetailPage({
  params,
}: {
  params: Promise<{ project: string; number: string }>;
}) {
  const { project: slug, number: numStr } = await params;
  const number = Number(numStr);
  if (!Number.isInteger(number)) notFound();

  const { project } = await requireProjectAccess(slug);
  const user = await getSessionUser();
  const result = await getPull(project.id, number);
  if (!result) notFound();
  const { pull, reviews } = result;

  let diff: GitHubDiffFile[] = [];
  try {
    const source = getGitHubSource({
      project,
      admin: createAdminClient(),
      viewerLogin: user?.profile?.github_username ?? null,
    });
    diff = await source.getPullDiff(number);
  } catch {
    diff = [];
  }

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur md:px-6">
        <Link
          href={`/app/${slug}/pulls`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Pull Requests
        </Link>
      </div>

      <PageBody className="max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {pull.title}{" "}
              <span className="font-normal text-muted-foreground">
                #{pull.number}
              </span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PrStateBadge state={pull.state} draft={pull.draft} />
              <ReviewDecisionBadge decision={pull.reviewDecision} />
              <CiBadge state={pull.ciState} />
              <DataOrigin origin="github" />
              <span className="inline-flex items-center gap-1 font-mono text-2xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                {pull.baseRef} <span aria-hidden>←</span> {pull.headRef}
              </span>
            </div>
            <p className="mt-1.5 text-2xs text-muted-foreground">
              {pull.author ? `@${pull.author.login} ` : ""}opened{" "}
              <RelativeTime value={pull.createdAt} /> ·{" "}
              <span className="text-success">+{pull.additions}</span>{" "}
              <span className="text-destructive">−{pull.deletions}</span> ·{" "}
              {pull.changedFiles} files
              {pull.linkedIssueNumber && (
                <>
                  {" · "}
                  <Link
                    href={`/app/${slug}/issues/${pull.linkedIssueNumber}`}
                    className="text-primary hover:underline"
                  >
                    closes #{pull.linkedIssueNumber}
                  </Link>
                </>
              )}
            </p>
          </div>
          {pull.htmlUrl && (
            <a
              href={pull.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-2xs text-muted-foreground hover:text-foreground"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {pull.labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {pull.labels.map((l) => (
              <LabelPill key={l.name} name={l.name} color={l.color} />
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_220px]">
          <div className="min-w-0 space-y-8">
            <div className="rounded-lg border border-border bg-card p-4">
              <Markdown>{pull.body}</Markdown>
            </div>

            <section>
              <h2 className="mb-2 flex items-center gap-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                <FileDiff className="h-3.5 w-3.5" /> Changes
                <DataOrigin origin="github" />
              </h2>
              <DiffViewer files={diff} />
            </section>
          </div>

          <aside className="space-y-6">
            <div>
              <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                Reviewers
              </p>
              {pull.requestedReviewers.length === 0 && reviews.length === 0 ? (
                <p className="text-2xs text-muted-foreground">
                  No reviewers requested
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {reviews.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Avatar className="h-5 w-5">
                        {r.reviewer_avatar_url && (
                          <AvatarImage src={r.reviewer_avatar_url} alt="" />
                        )}
                        <AvatarFallback>
                          {initials(r.reviewer_login)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">@{r.reviewer_login}</span>
                      <span
                        className={cn(
                          "ml-auto shrink-0 text-2xs",
                          r.state === "approved"
                            ? "text-success"
                            : r.state === "changes_requested"
                              ? "text-destructive"
                              : "text-muted-foreground",
                        )}
                      >
                        {r.state.replace("_", " ")}
                      </span>
                    </li>
                  ))}
                  {pull.requestedReviewers
                    .filter(
                      (rr) =>
                        !reviews.some((r) => r.reviewer_login === rr.login),
                    )
                    .map((rr) => (
                      <li
                        key={rr.login}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={rr.avatar_url} alt="" />
                          <AvatarFallback>
                            {initials(rr.login)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">@{rr.login}</span>
                        <span className="ml-auto shrink-0 text-2xs text-muted-foreground">
                          pending
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {reviews.some((r) => r.body) && (
              <div className="border-t border-border pt-4">
                <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                  Review notes
                </p>
                <ul className="space-y-2">
                  {reviews
                    .filter((r) => r.body)
                    .map((r) => (
                      <li key={r.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          @{r.reviewer_login}
                        </span>
                        : {r.body}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                Updated
              </p>
              <p className="text-2xs text-muted-foreground">
                <RelativeTime value={pull.updatedAt} />
              </p>
            </div>
          </aside>
        </div>
      </PageBody>
    </>
  );
}
