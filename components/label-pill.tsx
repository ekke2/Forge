import { labelColorStyle } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LabelPill({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-2xs font-medium",
        className,
      )}
      style={labelColorStyle(color || "64748b")}
    >
      {name}
    </span>
  );
}
