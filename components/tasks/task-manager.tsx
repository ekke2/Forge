"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { DataOrigin } from "@/components/data-origin";
import { EmptyState } from "@/components/empty-state";
import { WORKFLOW_STATUSES, PRIORITIES } from "@/lib/workflow";
import type { WorkflowStatus } from "@/lib/workflow";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/lib/actions/tasks";
import type { AppTaskView } from "@/lib/data/tasks";

interface Member {
  id: string;
  name: string;
}

export function TaskManager({
  projectId,
  tasks,
  members,
  currentUserId,
}: {
  projectId: string;
  tasks: AppTaskView[];
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  async function setStatus(id: string, status: WorkflowStatus) {
    const res = await updateTaskAction(projectId, id, { status });
    if (res.ok) startTransition(() => router.refresh());
    else toast.error(res.message);
  }

  async function remove(id: string) {
    const res = await deleteTaskAction(projectId, id);
    if (res.ok) {
      toast.success("Task deleted");
      startTransition(() => router.refresh());
    } else toast.error(res.message);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          Forge tasks in this project
          <DataOrigin origin="forge" />
        </h2>
        <NewTaskDialog
          open={open}
          onOpenChange={setOpen}
          projectId={projectId}
          members={members}
          currentUserId={currentUserId}
          onCreated={() => startTransition(() => router.refresh())}
        />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No Forge tasks yet"
          description="Forge tasks are lightweight, app-native to-dos that live alongside GitHub issues."
        />
      ) : (
        <div className="space-y-1.5">
          {tasks.map((t) => (
            <div
              key={t.id}
              id={t.id}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
            >
              <PriorityBadge priority={t.priority} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{t.title}</p>
                {t.description && (
                  <p className="truncate text-2xs text-muted-foreground">
                    {t.description}
                  </p>
                )}
              </div>
              {t.assignee && (
                <span className="hidden text-2xs text-muted-foreground sm:inline">
                  {t.assignee.display_name}
                </span>
              )}
              <Select
                value={t.status}
                onValueChange={(v) => setStatus(t.id, v as WorkflowStatus)}
              >
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue>
                    <WorkflowBadge status={t.status} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(t.id)}
                aria-label="Delete task"
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewTaskDialog({
  open,
  onOpenChange,
  projectId,
  members,
  currentUserId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  members: Member[];
  currentUserId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("none");
  const [assigneeId, setAssigneeId] = useState<string>(currentUserId);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const res = await createTaskAction(projectId, {
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority as "none",
      status: "todo",
      assigneeId: assigneeId || null,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Task created");
      setTitle("");
      setDescription("");
      onOpenChange(false);
      onCreated();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus /> New task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Forge task</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea
              id="t-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
