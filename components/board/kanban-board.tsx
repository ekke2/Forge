"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { IssueCard } from "@/components/board/issue-card";
import { WORKFLOW_STATUSES, type WorkflowStatus } from "@/lib/workflow";
import { setIssueWorkflowAction } from "@/lib/actions/issues";
import { cn } from "@/lib/utils";
import type { BoardColumn } from "@/lib/data/issues";
import type { IssueView } from "@/lib/data/issues";

export function KanbanBoard({
  projectId,
  slug,
  columns: initialColumns,
  canEdit,
}: {
  projectId: string;
  slug: string;
  columns: BoardColumn[];
  canEdit: boolean;
}) {
  const [board, setBoard] = useState(() => toMap(initialColumns));
  const [activeId, setActiveId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const activeIssue = useMemo(() => {
    if (activeId == null) return null;
    for (const list of Object.values(board)) {
      const hit = list.find((i) => i.number === activeId);
      if (hit) return hit;
    }
    return null;
  }, [activeId, board]);

  function onDragStart(e: DragStartEvent) {
    setActiveId(Number(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const issueNumber = Number(active.id);
    const target = over.id as WorkflowStatus;
    const source = (active.data.current?.status as WorkflowStatus) ?? null;
    if (!source || source === target) return;

    const moved = board[source].find((i) => i.number === issueNumber);
    if (!moved) return;

    // Optimistic move.
    const prev = board;
    setBoard({
      ...board,
      [source]: board[source].filter((i) => i.number !== issueNumber),
      [target]: [{ ...moved, workflowStatus: target }, ...board[target]],
    });

    const res = await setIssueWorkflowAction(projectId, issueNumber, {
      status: target,
    });
    if (!res.ok) {
      setBoard(prev);
      toast.error("Couldn't move issue", { description: res.message });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {WORKFLOW_STATUSES.map((col) => (
          <Column
            key={col.id}
            status={col.id}
            label={col.label}
            dot={col.dot}
            issues={board[col.id]}
            slug={slug}
            canEdit={canEdit}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeIssue ? (
          <div className="w-72 rotate-1">
            <IssueCard issue={activeIssue} dragging={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  label,
  dot,
  issues,
  slug,
  canEdit,
}: {
  status: WorkflowStatus;
  label: string;
  dot: string;
  issues: IssueView[];
  slug: string;
  canEdit: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border border-border bg-muted/30 p-2 transition-colors",
        isOver && "border-primary/50 bg-selected",
      )}
    >
      <div className="flex items-center gap-2 px-1 pb-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {label}
        <span className="ml-auto text-muted-foreground/60">{issues.length}</span>
      </div>
      <div className="flex-1 space-y-2">
        {issues.map((issue) =>
          canEdit ? (
            <DraggableCard
              key={issue.number}
              issue={issue}
              status={status}
              slug={slug}
            />
          ) : (
            <IssueCard
              key={issue.number}
              issue={issue}
              href={`/app/${slug}/issues/${issue.number}`}
            />
          ),
        )}
        {issues.length === 0 && (
          <p className="px-1 py-6 text-center text-2xs text-muted-foreground/60">
            Nothing here
          </p>
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  issue,
  status,
  slug,
}: {
  issue: IssueView;
  status: WorkflowStatus;
  slug: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: issue.number,
    data: { status },
  });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className="touch-none">
      {isDragging ? (
        <IssueCard issue={issue} dragging />
      ) : (
        <Link href={`/app/${slug}/issues/${issue.number}`} className="block">
          <IssueCard issue={issue} />
        </Link>
      )}
    </div>
  );
}

function toMap(columns: BoardColumn[]): Record<WorkflowStatus, IssueView[]> {
  const map: Record<WorkflowStatus, IssueView[]> = {
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  };
  for (const col of columns) map[col.status] = col.issues;
  return map;
}
