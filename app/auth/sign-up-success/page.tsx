import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default function SignUpSuccessPage() {
  return (
    <AuthShell
      title="Check your email"
      subtitle="One more step to activate your account."
    >
      <p className="text-sm text-muted-foreground">
        We&apos;ve sent a confirmation link to your inbox. Open it to finish
        setting up your Forge account, then sign in.
      </p>
      <Button asChild variant="outline" className="mt-4 w-full">
        <Link href="/auth/login">Go to sign in</Link>
      </Button>
    </AuthShell>
  );
}
