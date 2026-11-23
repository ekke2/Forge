import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

interface Person {
  login: string;
  avatar_url?: string;
}

export function AssigneeAvatars({
  people,
  size = 20,
  max = 3,
  className,
}: {
  people: Person[];
  size?: number;
  max?: number;
  className?: string;
}) {
  if (people.length === 0) return null;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <div className={cn("flex -space-x-1.5", className)}>
      {shown.map((p) => (
        <Tooltip key={p.login}>
          <TooltipTrigger asChild>
            <Avatar
              className="ring-2 ring-background"
              style={{ height: size, width: size }}
            >
              {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.login} />}
              <AvatarFallback>{initials(p.login)}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>@{p.login}</TooltipContent>
        </Tooltip>
      ))}
      {extra > 0 && (
        <span
          className="flex items-center justify-center rounded-full border border-border bg-muted text-2xs text-muted-foreground ring-2 ring-background"
          style={{ height: size, width: size }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
