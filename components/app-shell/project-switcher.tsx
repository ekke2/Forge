"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, GitBranch } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ShellProject } from "@/components/app-shell/types";

export function ProjectSwitcher({
  projects,
  activeProject,
}: {
  projects: ShellProject[];
  activeProject: ShellProject | null;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/15 text-primary">
          <GitBranch className="h-3 w-3" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">
            {activeProject?.name ?? "Select project"}
          </span>
          {activeProject && (
            <span className="block truncate font-mono text-2xs text-muted-foreground">
              {activeProject.repoFullName}
            </span>
          )}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {projects.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onSelect={() => router.push(`/app/${p.slug}/overview`)}
            className="gap-2"
          >
            <Check
              className={cn(
                "h-3.5 w-3.5",
                p.id === activeProject?.id ? "opacity-100" : "opacity-0",
              )}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{p.name}</span>
              <span className="block truncate font-mono text-2xs text-muted-foreground">
                {p.repoFullName}
              </span>
            </span>
            {p.plan === "team" && (
              <span className="rounded bg-primary/15 px-1 text-2xs text-primary">
                Team
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => router.push("/app/new")}
          className="gap-2 text-muted-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Connect a repository
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
