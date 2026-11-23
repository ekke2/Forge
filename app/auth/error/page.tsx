import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthShell title="Something went wrong" subtitle="We couldn't complete that.">
      <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        {error ? decodeURIComponent(error) : "An unspecified error occurred."}
      </p>
      <Button asChild variant="outline" className="mt-4 w-full">
        <Link href="/auth/login">Back to sign in</Link>
      </Button>
    </AuthShell>
  );
}
