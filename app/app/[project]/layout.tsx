import { requireProjectAccess, canManage } from "@/lib/auth";
import { ProjectProvider } from "@/components/project/project-context";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ project: string }>;
}) {
  const { project: slug } = await params;
  const { project, role } = await requireProjectAccess(slug);

  return (
    <ProjectProvider
      value={{
        id: project.id,
        slug: project.slug,
        name: project.name,
        plan: project.plan,
        role,
        repoFullName: project.repo_full_name,
        canManage: canManage(role),
      }}
    >
      {children}
    </ProjectProvider>
  );
}
