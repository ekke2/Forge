import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireProjectAccess } from "@/lib/auth";
import { listLabels, listIssues } from "@/lib/data/issues";
import { listProjectMembers } from "@/lib/data/projects";
import { PageHeader, PageBody } from "@/components/page-header";
import { CreateIssueForm } from "@/components/issue/create-issue-form";

export const metadata: Metadata = { title: "New issue" };

export default async function NewIssuePage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project: slug } = await params;
  const { project } = await requireProjectAccess(slug);

  const [labels, issues, members] = await Promise.all([
    listLabels(project.id),
    listIssues(project.id, { state: "all" }),
    listProjectMembers(project.id),
  ]);

  const assignees = [
    ...new Set([
      ...members
        .map((m) => m.profile?.github_username)
        .filter((x): x is string => Boolean(x)),
      ...issues.flatMap((i) => i.assignees.map((a) => a.login)),
    ]),
  ].sort();

  return (
    <>
      <PageHeader
        title="New issue"
        actions={
          <Link
            href={`/app/${slug}/issues`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to issues
          </Link>
        }
      />
      <PageBody className="max-w-2xl">
        <CreateIssueForm
          projectId={project.id}
          slug={slug}
          repoFullName={project.repo_full_name}
          labels={labels}
          assignees={assignees}
        />
      </PageBody>
    </>
  );
}
