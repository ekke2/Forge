"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutGrid,
  ListChecks,
  CircleDot,
  GitPullRequest,
  Activity,
  Users,
  Settings,
  Plus,
  RefreshCw,
  MoonStar,
  FolderGit2,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { toast } from "sonner";
import type { ShellProject } from "@/components/app-shell/types";

interface SearchHit {
  number: number;
  title: string;
  state: string;
}

export function CommandMenu({
  open,
  onOpenChange,
  projects,
  activeProject,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projects: ShellProject[];
  activeProject: ShellProject | null;
}) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ issues: SearchHit[]; pulls: SearchHit[] }>({
    issues: [],
    pulls: [],
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!activeProject || query.trim().length < 2) {
      setHits({ issues: [], pulls: [] });
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/projects/${activeProject.id}/search?q=${encodeURIComponent(query)}`,
          { signal: ctrl.signal },
        );
        if (res.ok) setHits(await res.json());
      } catch {
        /* aborted */
      }
    }, 180);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query, activeProject]);

  function run(fn: () => void) {
    onOpenChange(false);
    fn();
  }

  const base = activeProject ? `/app/${activeProject.slug}` : "/app";

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search issues and pull requests, or run a command…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {(hits.issues.length > 0 || hits.pulls.length > 0) && (
          <>
            <CommandGroup heading="Issues">
              {hits.issues.map((h) => (
                <CommandItem
                  key={`i-${h.number}`}
                  value={`issue ${h.number} ${h.title}`}
                  onSelect={() =>
                    run(() => router.push(`${base}/issues/${h.number}`))
                  }
                >
                  <CircleDot
                    className={
                      h.state === "open" ? "text-success" : "text-muted-foreground"
                    }
                  />
                  <span className="truncate">{h.title}</span>
                  <CommandShortcut>#{h.number}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Pull requests">
              {hits.pulls.map((h) => (
                <CommandItem
                  key={`p-${h.number}`}
                  value={`pr ${h.number} ${h.title}`}
                  onSelect={() =>
                    run(() => router.push(`${base}/pulls/${h.number}`))
                  }
                >
                  <GitPullRequest />
                  <span className="truncate">{h.title}</span>
                  <CommandShortcut>#{h.number}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => run(() => router.push(`${base}/overview`))}>
            <LayoutGrid /> Overview <CommandShortcut>G O</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push(`${base}/tasks`))}>
            <ListChecks /> My Tasks <CommandShortcut>G M</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push(`${base}/issues`))}>
            <CircleDot /> Issues <CommandShortcut>G I</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push(`${base}/pulls`))}>
            <GitPullRequest /> Pull Requests <CommandShortcut>G P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push(`${base}/activity`))}>
            <Activity /> Activity
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push(`${base}/members`))}>
            <Users /> Members
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push(`${base}/settings`))}>
            <Settings /> Settings
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => run(() => router.push(`${base}/issues/new`))}
          >
            <Plus /> Create issue <CommandShortcut>C</CommandShortcut>
          </CommandItem>
          {activeProject && (
            <CommandItem
              onSelect={() =>
                run(async () => {
                  const p = fetch(`/api/projects/${activeProject.id}/sync`, {
                    method: "POST",
                  }).then((r) => {
                    if (!r.ok) throw new Error();
                    router.refresh();
                  });
                  toast.promise(p, {
                    loading: "Syncing with GitHub…",
                    success: "Project synced",
                    error: "Sync failed",
                  });
                })
              }
            >
              <RefreshCw /> Sync now
            </CommandItem>
          )}
          <CommandItem
            onSelect={() =>
              run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
            }
          >
            <MoonStar /> Toggle theme
          </CommandItem>
        </CommandGroup>

        {projects.length > 1 && (
          <CommandGroup heading="Switch project">
            {projects.map((p) => (
              <CommandItem
                key={p.id}
                value={`project ${p.name} ${p.repoFullName}`}
                onSelect={() =>
                  run(() => router.push(`/app/${p.slug}/overview`))
                }
              >
                <FolderGit2 />
                <span className="truncate">{p.name}</span>
                <CommandShortcut className="font-mono">
                  {p.repoFullName}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
