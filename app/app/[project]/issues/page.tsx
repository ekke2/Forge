import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, CircleDot } from "lucide-react";
import { requireProjectAccess } from "@/lib/auth";
import {
  listIssues,
  getBoard,
  listLabels,
  type ListIssuesOptions,
} from "@/lib/data/issues";
import { PageHeader, PageBody } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { IssuesToolbar } from "@/components/issue/issues-toolbar";
import { IssueRow } from "@/components/issue/issue-row";
import { KanbanBoard } from "@/components/board/kanban-board";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton, BoardSkeleton } from "@/components/skeletons";

export const metadata: Metadata = { title: "Issues" };

interface SP {
  view?: string;
  state?: string;
  label?: string;
  assignee?: string;
  q?: string;
}

export default async function IssuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ project: string }>;
  searchParams: Promise<SP>;
}) {
  const { project: slug } = await params;
  const sp = await searchParams;
  const isBoard = sp.view === "board";

  return (
    <>
      <PageHeader
        title="Issues"
        description="GitHub issues with a Forge workflow layered on top."
        actions={
          <Button asChild size="sm">
            <Link href={`/app/${slug}/issues/new`}>
              <Plus /> New issue
            </Link>
          </Button>
        }
      >
        <Suspense fallback={<div className="h-8" />}>
          <ToolbarLoader slug={slug} />
        </Suspense>
      </PageHeader>

      <PageBody className={isBoard ? "max-w-none" : undefined}>
        <Suspense
          key={JSON.stringify(sp)}
          fallback={isBoard ? <BoardSkeleton /> : <ListSkeleton />}
        >
          {isBoard ? (
            <BoardView slug={slug} />
          ) : (
            <ListView slug={slug} sp={sp} />
          )}
        </Suspense>
      </PageBody>
    </>
  );
}

async function ToolbarLoader({ slug }: { slug: string }) {
  const { project } = await requireProjectAccess(slug);
  const [labels, issues] = await Promise.all([
    listLabels(project.id),
    listIssues(project.id, { state: "all" }),
  ]);
  const assignees = [
    ...new Set(issues.flatMap((i) => i.assignees.map((a) => a.login))),
  ].sort();
  return <IssuesToolbar labels={labels} assignees={assignees} />;
}

async function ListView({ slug, sp }: { slug: string; sp: SP }) {
  const { project } = await requireProjectAccess(slug);
  const opts: ListIssuesOptions = {
    state: (sp.state as ListIssuesOptions["state"]) ?? "open",
    label: sp.label,
    assignee: sp.assignee,
    search: sp.q,
  };
  const issues = await listIssues(project.id, opts);

  if (issues.length === 0) {
    return (
      <EmptyState
        icon={CircleDot}
        title={sp.q || sp.label || sp.assignee ? "No matching issues" : "No issues yet"}
        description={
          sp.q || sp.label || sp.assignee
            ? "Try clearing the filters."
            : "Create an issue in Forge — it's written straight to GitHub — or run a sync to pull existing issues."
        }
        action={
          <Button asChild size="sm">
            <Link href={`/app/${slug}/issues/new`}>
              <Plus /> New issue
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {issues.map((issue) => (
        <IssueRow
          key={issue.number}
          issue={issue}
          href={`/app/${slug}/issues/${issue.number}`}
        />
      ))}
    </div>
  );
}

async function BoardView({ slug }: { slug: string }) {
  const { project, role } = await requireProjectAccess(slug);
  const columns = await getBoard(project.id);
  const total = columns.reduce((n, c) => n + c.issues.length, 0);

  if (total === 0) {
    return (
      <EmptyState
        icon={CircleDot}
        title="Board is empty"
        description="Once issues are synced they'll appear here, grouped by Forge workflow status."
      />
    );
  }

  return (
    <KanbanBoard
      projectId={project.id}
      slug={slug}
      columns={columns}
      canEdit={role !== "viewer"}
    />
  );
}
