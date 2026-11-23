"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSelectedLayoutSegments } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/app-shell/sidebar";
import { CommandMenu } from "@/components/app-shell/command-menu";
import type { ShellProject, ShellUser } from "@/components/app-shell/types";

export function AppShell({
  projects,
  user,
  children,
}: {
  projects: ShellProject[];
  user: ShellUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSelectedLayoutSegments();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // /app/[project]/[section] — segment[0] is the project slug for routed pages.
  const activeProject = useMemo(() => {
    const slug = segments[0];
    return projects.find((p) => p.slug === slug) ?? projects[0] ?? null;
  }, [segments, projects]);

  useEffect(() => setMobileOpen(false), [pathname]);

  const go = useCallback(
    (section: string) => {
      if (activeProject) router.push(`/app/${activeProject.slug}/${section}`);
    },
    [router, activeProject],
  );

  // Keyboard: ⌘K / Ctrl+K, "c" create issue, "/" search, "g" then o/m/i/p.
  useEffect(() => {
    let pendingG = false;
    let gTimer: ReturnType<typeof setTimeout> | undefined;

    function isTyping(el: EventTarget | null) {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        node.isContentEditable
      );
    }

    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
        return;
      }
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      if (pendingG) {
        pendingG = false;
        clearTimeout(gTimer);
        const map: Record<string, string> = {
          o: "overview",
          m: "tasks",
          i: "issues",
          p: "pulls",
          a: "activity",
        };
        const section = map[e.key.toLowerCase()];
        if (section) {
          e.preventDefault();
          go(section);
        }
        return;
      }

      if (e.key === "g") {
        pendingG = true;
        gTimer = setTimeout(() => (pendingG = false), 800);
        return;
      }
      if (e.key === "c") {
        e.preventDefault();
        go("issues/new");
      }
      if (e.key === "/") {
        e.preventDefault();
        setCmdOpen(true);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(gTimer);
    };
  }, [go]);

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* Desktop sidebar — fixed, scrolls independently */}
      <aside className="hidden h-svh w-60 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar md:block">
        <Sidebar
          projects={projects}
          activeProject={activeProject}
          user={user}
          onOpenCommand={() => setCmdOpen(true)}
        />
      </aside>

      {/* Mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            projects={projects}
            activeProject={activeProject}
            user={user}
            onOpenCommand={() => {
              setMobileOpen(false);
              setCmdOpen(true);
            }}
          />
        </SheetContent>
      </Sheet>

      <div className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3 md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
          <Logo markClassName="h-4 w-4" className="[&_span]:text-sm" />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandMenu
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        projects={projects}
        activeProject={activeProject}
      />
    </div>
  );
}
