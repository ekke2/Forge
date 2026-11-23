import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter a new password for your account."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
