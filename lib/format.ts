import { formatDistanceToNowStrict, format, isToday, isYesterday } from "date-fns";

/** "2 minutes ago", "3 days ago". Accepts Date | ISO string | null. */
export function relativeTime(value: string | Date | null | undefined): string {
  if (!value) return "never";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "unknown";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

/** Short absolute date, e.g. "Feb 4" or "Feb 4, 2024" when not this year. */
export function shortDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return format(date, sameYear ? "MMM d" : "MMM d, yyyy");
}

/** Chat-style timestamp: "09:41", "Yesterday 09:41", "Feb 4 09:41". */
export function messageTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return `Yesterday ${format(date, "HH:mm")}`;
  return format(date, "MMM d, HH:mm");
}

/** 1234 -> "1.2k", 1200000 -> "1.2M". */
export function compactNumber(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/** Deterministic label colour -> tailwind-friendly inline style. */
export function labelColorStyle(hex: string): React.CSSProperties {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) || 0;
  const g = parseInt(c.slice(2, 4), 16) || 0;
  const b = parseInt(c.slice(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return {
    backgroundColor: `#${c}22`,
    color: `#${c}`,
    borderColor: `#${c}55`,
    // keep readable text if the label colour itself is very light
    ...(luminance > 0.8 ? { color: "hsl(var(--foreground))" } : {}),
  };
}
