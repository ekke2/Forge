"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, LayoutList, Columns3, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Label } from "@/lib/data/issues";

export function IssuesToolbar({
  labels,
  assignees,
}: {
  labels: Label[];
  assignees: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const view = params.get("view") ?? "list";
  const state = params.get("state") ?? "open";
  const label = params.get("label") ?? "all";
  const assignee = params.get("assignee") ?? "all";
  const q = params.get("q") ?? "";

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all" || (key === "state" && value === "open")) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const hasFilters =
    state !== "open" || label !== "all" || assignee !== "all" || q !== "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(v) => v && setParam("view", v === "list" ? null : v)}
      >
        <ToggleGroupItem value="list" aria-label="List view">
          <LayoutList /> List
        </ToggleGroupItem>
        <ToggleGroupItem value="board" aria-label="Board view">
          <Columns3 /> Board
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={q}
          placeholder="Filter by title…"
          className="h-8 w-44 pl-8 text-xs"
          onChange={(e) => {
            const v = e.target.value;
            window.clearTimeout(
              (e.target as HTMLInputElement).dataset.t as unknown as number,
            );
            const t = window.setTimeout(() => setParam("q", v || null), 300);
            (e.target as HTMLInputElement).dataset.t = String(t);
          }}
        />
      </div>

      <Select value={state} onValueChange={(v) => setParam("state", v)}>
        <SelectTrigger className="h-8 w-[110px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
          <SelectItem value="all">All states</SelectItem>
        </SelectContent>
      </Select>

      {labels.length > 0 && (
        <Select value={label} onValueChange={(v) => setParam("label", v)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All labels</SelectItem>
            {labels.map((l) => (
              <SelectItem key={l.name} value={l.name}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {assignees.length > 0 && (
        <Select value={assignee} onValueChange={(v) => setParam("assignee", v)}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Anyone</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a} value={a}>
                @{a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <button
          onClick={() =>
            startTransition(() =>
              router.replace(pathname, { scroll: false }),
            )
          }
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </div>
  );
}
