import { requireUser } from "@/lib/auth";
import { ConnectWizard } from "@/components/onboarding/connect-wizard";

export default async function NewProjectPage() {
  const user = await requireUser();
  return (
    <div className="px-4 py-12">
      <ConnectWizard
        githubLogin={user.profile?.github_username ?? null}
        allowCancel
      />
    </div>
  );
}
