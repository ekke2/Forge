import type { Metadata } from "next";
import { requireProjectAccess } from "@/lib/auth";
import { listProjectMembers } from "@/lib/data/projects";
import { getOverview } from "@/lib/data/overview";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, PageBody } from "@/components/page-header";
import { MembersPanel, type MemberCard } from "@/components/members/members-panel";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project: slug } = await params;
  const { project, role } = await requireProjectAccess(slug);
  const supabase = await createClient();

  const [members, overview, statsRes] = await Promise.all([
    listProjectMembers(project.id),
    getOverview(project.id),
    supabase
      .from("contribution_stats_cache")
      .select("*")
      .eq("project_id", project.id)
      .eq("period", "all"),
  ]);

  const statsByLogin = new Map(
    (statsRes.data ?? []).map((s) => [s.member_login, s]),
  );
  const workloadByLogin = new Map(
    overview.workload.map((w) => [w.login, w]),
  );

  const cards: MemberCard[] = members.map((m) => {
    const login = m.profile?.github_username ?? null;
    const s = login ? statsByLogin.get(login) : undefined;
    const w = login ? workloadByLogin.get(login) : undefined;
    return {
      userId: m.user_id,
      name: m.profile?.display_name ?? login ?? "Member",
      login,
      avatarUrl: m.profile?.avatar_url ?? null,
      role: m.role,
      isOwner: m.user_id === project.owner_id,
      openIssues: w?.openIssues ?? 0,
      reviewRequests: w?.reviewRequests ?? 0,
      stats: s
        ? {
            commits: s.commits,
            prs_opened: s.prs_opened,
            prs_merged: s.prs_merged,
            issues_closed: s.issues_closed,
            reviews: s.reviews,
          }
        : null,
    };
  });

  return (
    <>
      <PageHeader
        title="Members"
        description={`${members.length} ${members.length === 1 ? "person" : "people"} on this project.`}
      />
      <PageBody className="max-w-4xl">
        <MembersPanel
          projectId={project.id}
          projectSlug={slug}
          members={cards}
          plan={project.plan}
          viewerRole={role}
        />
      </PageBody>
    </>
  );
}
