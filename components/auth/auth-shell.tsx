import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 forge-grid opacity-50" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo className="[&_span]:text-base" markClassName="h-6 w-6" />
          </Link>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
        {footer && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
