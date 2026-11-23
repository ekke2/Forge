"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Github, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LabelPill } from "@/components/label-pill";
import { cn } from "@/lib/utils";
import { createIssueAction } from "@/lib/actions/issues";
import { WORKFLOW_STATUSES, PRIORITIES } from "@/lib/workflow";
import type { Label as GHLabel } from "@/lib/data/issues";

export function CreateIssueForm({
  projectId,
  slug,
  repoFullName,
  labels,
  assignees,
}: {
  projectId: string;
  slug: string;
  repoFullName: string;
  labels: GHLabel[];
  assignees: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pickedLabels, setPickedLabels] = useState<string[]>([]);
  const [pickedAssignees, setPickedAssignees] = useState<string[]>([]);
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("none");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], v: string, set: (x: string[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the issue a title.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await createIssueAction(projectId, {
      title: title.trim(),
      body: body.trim() || undefined,
      labels: pickedLabels,
      assignees: pickedAssignees,
      workflowStatus: status as "todo",
      priority: priority as "none",
    });
    if (res.ok) {
      toast.success(`Created issue #${res.data.number} on GitHub`);
      router.push(`/app/${slug}/issues/${res.data.number}`);
      router.refresh();
    } else {
      setError(res.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-2xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          <Github className="h-3 w-3" /> {repoFullName}
        </span>
        {" — "}the issue is created on GitHub first, then mirrored into Forge.
        GitHub stays authoritative.
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short, specific summary"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">Description</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Markdown supported. Context, steps, expected behaviour…"
          rows={8}
        />
      </div>

      {labels.length > 0 && (
        <div className="space-y-1.5">
          <Label>Labels</Label>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((l) => (
              <button
                key={l.name}
                type="button"
                onClick={() =>
                  toggle(pickedLabels, l.name, setPickedLabels)
                }
                className={cn(
                  "rounded-full ring-offset-background transition",
                  pickedLabels.includes(l.name)
                    ? "ring-2 ring-primary ring-offset-1"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <LabelPill name={l.name} color={l.color} />
              </button>
            ))}
          </div>
        </div>
      )}

      {assignees.length > 0 && (
        <div className="space-y-1.5">
          <Label>Assignees</Label>
          <div className="flex flex-wrap gap-1.5">
            {assignees.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() =>
                  toggle(pickedAssignees, a, setPickedAssignees)
                }
                className={cn(
                  "rounded-full border px-2 py-0.5 font-mono text-2xs transition",
                  pickedAssignees.includes(a)
                    ? "border-primary bg-selected text-primary"
                    : "border-border text-muted-foreground hover:bg-hover",
                )}
              >
                @{a}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Workflow column</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORKFLOW_STATUSES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-2xs text-muted-foreground">
        Workflow column and priority are Forge-owned metadata — they don&apos;t
        change anything on GitHub.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          {submitting ? "Creating on GitHub…" : "Create issue"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/app/${slug}/issues`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
