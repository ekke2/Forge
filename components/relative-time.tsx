import { relativeTime } from "@/lib/format";

/**
 * Server-rendered relative time. It's a snapshot as of render — fine for a
 * feed. `suppressHydrationWarning` guards the rare case where the client
 * re-renders a minute later.
 */
export function RelativeTime({
  value,
  className,
}: {
  value: string | Date | null | undefined;
  className?: string;
}) {
  if (!value) return <span className={className}>—</span>;
  const iso = typeof value === "string" ? value : value.toISOString();
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {relativeTime(value)}
    </time>
  );
}
