"use client";

import { useMemo, useState } from "react";
import {
  FileDiff,
  FilePlus2,
  FileMinus2,
  FilePen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GitHubDiffFile } from "@/lib/github/types";

export function DiffViewer({ files }: { files: GitHubDiffFile[] }) {
  const [active, setActive] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const totals = useMemo(
    () => ({
      add: files.reduce((n, f) => n + f.additions, 0),
      del: files.reduce((n, f) => n + f.deletions, 0),
    }),
    [files],
  );

  if (files.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
        No file changes to display.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      {/* File tree */}
      <aside className="lg:sticky lg:top-16 lg:self-start">
        <p className="mb-2 flex items-center justify-between text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>{files.length} files</span>
          <span>
            <span className="text-success">+{totals.add}</span>{" "}
            <span className="text-destructive">−{totals.del}</span>
          </span>
        </p>
        <ul className="space-y-0.5">
          {files.map((f, i) => (
            <li key={f.filename}>
              <button
                onClick={() => {
                  setActive(i);
                  document
                    .getElementById(`diff-${i}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left font-mono text-2xs",
                  active === i
                    ? "bg-selected text-foreground"
                    : "text-muted-foreground hover:bg-hover",
                )}
              >
                <StatusIcon status={f.status} />
                <span className="truncate">{shortName(f.filename)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Diffs */}
      <div className="min-w-0 space-y-4">
        {files.map((f, i) => (
          <div
            key={f.filename}
            id={`diff-${i}`}
            className="overflow-hidden rounded-lg border border-border"
          >
            <button
              onClick={() =>
                setCollapsed((c) => ({ ...c, [i]: !c[i] }))
              }
              className="flex w-full items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 text-left"
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform",
                  !collapsed[i] && "rotate-90",
                )}
              />
              <StatusIcon status={f.status} />
              <span className="truncate font-mono text-xs text-foreground">
                {f.filename}
              </span>
              <span className="ml-auto shrink-0 font-mono text-2xs">
                <span className="text-success">+{f.additions}</span>{" "}
                <span className="text-destructive">−{f.deletions}</span>
              </span>
            </button>
            {!collapsed[i] && (
              <pre className="overflow-x-auto bg-card font-mono text-xs leading-relaxed">
                <code>
                  {f.patch.split("\n").map((line, li) => (
                    <div
                      key={li}
                      className={cn(
                        "px-3",
                        line.startsWith("+") &&
                          !line.startsWith("+++") &&
                          "bg-success/10 text-success",
                        line.startsWith("-") &&
                          !line.startsWith("---") &&
                          "bg-destructive/10 text-destructive",
                        line.startsWith("@@") && "bg-primary/10 text-primary",
                        !/^[+\-@]/.test(line) && "text-muted-foreground",
                      )}
                    >
                      {line || " "}
                    </div>
                  ))}
                </code>
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: GitHubDiffFile["status"] }) {
  const map = {
    added: { icon: FilePlus2, cls: "text-success" },
    removed: { icon: FileMinus2, cls: "text-destructive" },
    renamed: { icon: FilePen, cls: "text-warning" },
    modified: { icon: FileDiff, cls: "text-muted-foreground" },
  } as const;
  const { icon: Icon, cls } = map[status] ?? map.modified;
  return <Icon className={cn("h-3.5 w-3.5 shrink-0", cls)} />;
}

function shortName(path: string) {
  const parts = path.split("/");
  if (parts.length <= 2) return path;
  return `…/${parts.slice(-2).join("/")}`;
}
