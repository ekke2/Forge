import { Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { ForgeMark } from "@/components/brand/logo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Instructions §25: the UI should always make clear which objects GitHub owns
 * and which are Forge's own. This little marker does that consistently.
 */
export function DataOrigin({
  origin,
  className,
}: {
  origin: "github" | "forge";
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded border px-1 py-0.5 text-2xs font-medium",
            origin === "github"
              ? "border-border text-muted-foreground"
              : "border-primary/30 text-primary",
            className,
          )}
        >
          {origin === "github" ? (
            <Github className="h-3 w-3" />
          ) : (
            <ForgeMark spark={false} className="h-3 w-3" />
          )}
          {origin === "github" ? "GitHub" : "Forge"}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {origin === "github"
          ? "GitHub-owned — synced from the repository. GitHub stays authoritative."
          : "Forge-owned — created and stored by Forge."}
      </TooltipContent>
    </Tooltip>
  );
}
