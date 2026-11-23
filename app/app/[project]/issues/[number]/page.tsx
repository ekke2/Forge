import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  GitCommitHorizontal,
  GitPullRequest,
  MessagesSquare,
} from "lucide-react";
import { requireProjectAccess } from "@/lib/auth";
import { getIssue } from "@/lib/data/issues";
import { listIssueMessages } from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/server";
import { PageBody } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { LabelPill } from "@/components/label-pill";
import { AssigneeAvatars } from "@/components/assignee-avatars";
import {
  GitHubStateBadge,
  WorkflowBadge,
} from "@/components/status-badge";
import { RelativeTime } from "@/components/relative-time";
import { DataOrigin } from "@/components/data-origin";
import { IssueWorkflowControls } from "@/components/issue/issue-workflow-controls";
import { MessageThread } from "@/components/messages/message-thread";
import { shortSha } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ project: string; number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  return { title: `Issue #${number}` };
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ project: string; number: string }>;
}) {
  const { project: slug, number: numStr } = await params;
  const number = Number(numStr);
  if (!Number.isInteger(number)) notFound();

  const { project, role } = await requireProjectAccess(slug);
  const issue = await getIssue(project.id, number);
  if (!issue) notFound();

  const supabase = await createClient();
  const { data: linkedCommits } = await supabase
    .from("commits_cache")
    .select("sha, message, author_login, authored_at, html_url")
    .eq("project_id", project.id)
    .ilike("message", `%#${number}%`)
    .order("authored_at", { ascending: false })
    .limit(8);

  const messages =
    project.plan === "team"
      ? await listIssueMessages(project.id, number)
      : [];

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur md:px-6">
        <Link
          href={`/app/${slug}/issues`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Issues
        </Link>
      </div>

      <PageBody className="max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            {/* Header */}
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {issue.title}{" "}
                  <span className="font-normal text-muted-foreground">
                    #{issue.number}
                  </span>
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <GitHubStateBadge
                    state={issue.githubState}
                    reason={issue.stateReason}
                  />
                  <WorkflowBadge status={issue.workflowStatus} />
                  <DataOrigin origin="github" />
                  <span className="text-2xs text-muted-foreground">
                    {issue.author ? `@${issue.author.login} opened this ` : "Opened "}
                    <RelativeTime value={issue.createdAt} />
                  </span>
                  {issue.htmlUrl && (
                    <a
                      href={issue.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground"
                    >
                      View on GitHub <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <Markdown>{issue.body}</Markdown>
            </div>

            {/* Linked development */}
            <section className="mt-8">
              <h2 className="mb-2 flex items-center gap-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                Linked development
                <DataOrigin origin="github" />
              </h2>
              {issue.linkedPr || (linkedCommits && linkedCommits.length > 0) ? (
                <div className="space-y-1.5">
                  {issue.linkedPr && (
                    <Link
                      href={`/app/${slug}/pulls/${issue.linkedPr.number}`}
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-hover"
                    >
                      <GitPullRequest className="h-4 w-4 text-success" />
                      <span className="font-mono text-2xs text-muted-foreground">
                        #{issue.linkedPr.number}
                      </span>
                      <span className="truncate">{issue.linkedPr.title}</span>
                      <span className="ml-auto text-2xs capitalize text-muted-foreground">
                        {issue.linkedPr.state}
                      </span>
                    </Link>
                  )}
                  {(linkedCommits ?? []).map((c) => (
                    <a
                      key={c.sha}
                      href={c.html_url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-hover"
                    >
                      <GitCommitHorizontal className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-2xs text-muted-foreground">
                        {shortSha(c.sha)}
                      </span>
                      <span className="truncate">
                        {c.message.split("\n")[0]}
                      </span>
                      <span className="ml-auto shrink-0 text-2xs text-muted-foreground">
                        {c.author_login ? `@${c.author_login}` : ""}{" "}
                        <RelativeTime value={c.authored_at} />
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  No commits or pull requests reference this issue yet.
                </p>
              )}
            </section>

            {/* Issue thread (Forge-owned) */}
            <section className="mt-8">
              <h2 className="mb-2 flex items-center gap-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                <MessagesSquare className="h-3.5 w-3.5" /> Discussion
                <DataOrigin origin="forge" />
              </h2>
              <div className="rounded-lg border border-border bg-card p-4">
                <MessageThread
                  projectId={project.id}
                  projectSlug={slug}
                  target={{ issueNumber: number }}
                  initialMessages={messages}
                  plan={project.plan}
                  compact
                />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <IssueWorkflowControls
              projectId={project.id}
              issueNumber={number}
              status={issue.workflowStatus}
              priority={issue.priority}
              githubState={issue.githubState}
              canEdit={role !== "viewer"}
            />

            <SidebarBlock label="Assignees">
              {issue.assignees.length ? (
                <div className="flex items-center gap-2">
                  <AssigneeAvatars people={issue.assignees} size={20} max={4} />
                  <span className="text-2xs text-muted-foreground">
                    {issue.assignees.map((a) => `@${a.login}`).join(", ")}
                  </span>
                </div>
              ) : (
                <p className="text-2xs text-muted-foreground">No one assigned</p>
              )}
            </SidebarBlock>

            <SidebarBlock label="Labels">
              {issue.labels.length ? (
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map((l) => (
                    <LabelPill key={l.name} name={l.name} color={l.color} />
                  ))}
                </div>
              ) : (
                <p className="text-2xs text-muted-foreground">None</p>
              )}
            </SidebarBlock>

            {issue.milestone && (
              <SidebarBlock label="Milestone">
                <p className="text-xs text-foreground">{issue.milestone}</p>
              </SidebarBlock>
            )}

            <SidebarBlock label="Updated">
              <p className="text-2xs text-muted-foreground">
                <RelativeTime value={issue.updatedAt} />
              </p>
            </SidebarBlock>
          </aside>
        </div>
      </PageBody>
    </>
  );
}

function SidebarBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border pt-4">
      <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
