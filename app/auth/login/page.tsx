import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return (
    <AuthShell
      title="Sign in to Forge"
      subtitle="Your project management, where your code lives."
      footer={
        <>
          New to Forge?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm redirect={redirect ?? null} />
    </AuthShell>
  );
}
