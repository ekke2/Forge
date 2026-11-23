import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listMyProjects } from "@/lib/data/projects";
import { AppShell } from "@/components/app-shell/app-shell";
import type { ShellProject, ShellUser } from "@/components/app-shell/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const projects = await listMyProjects();

  const shellProjects: ShellProject[] = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    repoFullName: p.repo_full_name,
    plan: p.plan,
    role: p.role,
    memberCount: p.member_count,
  }));

  const shellUser: ShellUser = {
    id: user.id,
    name: user.profile?.display_name ?? user.email?.split("@")[0] ?? "You",
    email: user.email,
    login: user.profile?.github_username ?? null,
    avatarUrl: user.profile?.avatar_url ?? null,
  };

  // No projects yet → straight to the connect flow (except the /app/new route,
  // which is the connect flow itself living under this layout).
  if (shellProjects.length === 0) {
    redirect("/onboarding");
  }

  return (
    <AppShell projects={shellProjects} user={shellUser}>
      {children}
    </AppShell>
  );
}
