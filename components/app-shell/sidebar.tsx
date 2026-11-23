"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { ProjectSwitcher } from "@/components/app-shell/project-switcher";
import { UserMenu } from "@/components/app-shell/user-menu";
import {
  WORKSPACE_NAV,
  TEAM_NAV,
  PROJECT_NAV,
  type NavItem,
} from "@/components/app-shell/nav-config";
import type { ShellProject, ShellUser } from "@/components/app-shell/types";

export function Sidebar({
  projects,
  activeProject,
  user,
  onOpenCommand,
}: {
  projects: ShellProject[];
  activeProject: ShellProject | null;
  user: ShellUser;
  onOpenCommand: () => void;
}) {
  const segments = useSelectedLayoutSegments();
  const activeSegment = segments[1] ?? "overview";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center px-3">
        <Link href="/app" className="flex items-center">
          <Logo markClassName="h-5 w-5" className="[&_span]:text-sm" />
        </Link>
      </div>

      <div className="px-2">
        <ProjectSwitcher projects={projects} activeProject={activeProject} />
      </div>

      <button
        onClick={onOpenCommand}
        className="mx-2 mt-2 flex items-center gap-2 rounded-md border border-sidebar-border bg-background/50 px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-hover"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1">Search…</span>
        <span className="kbd">⌘K</span>
      </button>

      <nav className="mt-3 flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        <NavSection
          items={WORKSPACE_NAV}
          activeSegment={activeSegment}
          project={activeProject}
        />
        <NavSection
          label="Team"
          items={TEAM_NAV}
          activeSegment={activeSegment}
          project={activeProject}
        />
        <NavSection
          label="Project"
          items={PROJECT_NAV}
          activeSegment={activeSegment}
          project={activeProject}
        />
      </nav>

      {activeProject && (
        <Link
          href="/app/new"
          className="mx-2 mb-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-hover hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          New project
        </Link>
      )}

      <div className="border-t border-sidebar-border p-2">
        <UserMenu user={user} />
      </div>
    </div>
  );
}

function NavSection({
  label,
  items,
  activeSegment,
  project,
}: {
  label?: string;
  items: NavItem[];
  activeSegment: string;
  project: ShellProject | null;
}) {
  if (!project) return null;
  const visible = items.filter(
    (item) => !item.teamOnly || project.plan === "team",
  );
  if (visible.length === 0) return null;

  return (
    <div>
      {label && (
        <p className="px-2 pb-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground/70">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {visible.map((item) => {
          const active = activeSegment === item.segment;
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                href={`/app/${project.slug}/${item.segment}`}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-hover hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="hidden font-mono text-2xs text-muted-foreground/50 group-hover:inline">
                    {item.shortcut}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
