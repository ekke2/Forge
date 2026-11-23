import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/sign-up-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return (
    <AuthShell
      title="Create your Forge account"
      subtitle="Connect a GitHub repository and get a workspace in seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm redirect={redirect ?? null} />
    </AuthShell>
  );
}
