"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CircleCheck, CircleDot } from "lucide-react";
import { WORKFLOW_STATUSES, PRIORITIES } from "@/lib/workflow";
import type { WorkflowStatus, TaskPriority } from "@/lib/workflow";
import { setIssueWorkflowAction, updateIssueAction } from "@/lib/actions/issues";

export function IssueWorkflowControls({
  projectId,
  issueNumber,
  status,
  priority,
  githubState,
  canEdit,
}: {
  projectId: string;
  issueNumber: number;
  status: WorkflowStatus;
  priority: TaskPriority;
  githubState: "open" | "closed";
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(status);
  const [localPriority, setLocalPriority] = useState(priority);
  const [closing, setClosing] = useState(false);

  async function updateWorkflow(patch: {
    status?: WorkflowStatus;
    priority?: TaskPriority;
  }) {
    const res = await setIssueWorkflowAction(projectId, issueNumber, patch);
    if (res.ok) startTransition(() => router.refresh());
    else toast.error(res.message);
  }

  async function toggleState() {
    setClosing(true);
    const res = await updateIssueAction(projectId, issueNumber, {
      state: githubState === "open" ? "closed" : "open",
    });
    setClosing(false);
    if (res.ok) {
      toast.success(
        githubState === "open" ? "Closed on GitHub" : "Reopened on GitHub",
      );
      startTransition(() => router.refresh());
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <Field label="Workflow">
        <Select
          value={localStatus}
          disabled={!canEdit || pending}
          onValueChange={(v) => {
            setLocalStatus(v as WorkflowStatus);
            updateWorkflow({ status: v as WorkflowStatus });
          }}
        >
          <SelectTrigger className="h-8">
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
      </Field>

      <Field label="Priority">
        <Select
          value={localPriority}
          disabled={!canEdit || pending}
          onValueChange={(v) => {
            setLocalPriority(v as TaskPriority);
            updateWorkflow({ priority: v as TaskPriority });
          }}
        >
          <SelectTrigger className="h-8">
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
      </Field>

      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={toggleState}
          disabled={closing}
        >
          {githubState === "open" ? (
            <>
              <CircleCheck /> Close on GitHub
            </>
          ) : (
            <>
              <CircleDot /> Reopen on GitHub
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
