import { SignalHigh, SignalLow, SignalMedium, AlertTriangle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_MAP, type TaskPriority } from "@/lib/workflow";

const ICONS: Record<TaskPriority, typeof Minus> = {
  none: Minus,
  low: SignalLow,
  medium: SignalMedium,
  high: SignalHigh,
  urgent: AlertTriangle,
};

export function PriorityBadge({
  priority,
  showLabel = false,
  className,
}: {
  priority: TaskPriority;
  showLabel?: boolean;
  className?: string;
}) {
  const meta = PRIORITY_MAP[priority];
  const Icon = ICONS[priority];
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs", meta.tone, className)}
      title={meta.label}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}
