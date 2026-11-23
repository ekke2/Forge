import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listMyProjects } from "@/lib/data/projects";
import { ConnectWizard } from "@/components/onboarding/connect-wizard";

export default async function OnboardingPage() {
  const user = await requireUser();
  const projects = await listMyProjects();
  if (projects.length > 0) redirect(`/app/${projects[0].slug}/overview`);

  return (
    <div className="relative min-h-svh bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 forge-grid opacity-40" />
      <div className="relative">
        <ConnectWizard githubLogin={user.profile?.github_username ?? null} />
      </div>
    </div>
  );
}
