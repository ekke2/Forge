import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { WorkflowStatus, TaskPriority } from "@/lib/workflow";
import { listIssues } from "@/lib/data/issues";

export type AppTaskRow = Database["public"]["Tables"]["app_tasks"]["Row"];

export interface AppTaskView extends AppTaskRow {
  assignee: Database["public"]["Tables"]["profiles"]["Row"] | null;
}

export async function listAppTasks(projectId: string): Promise<AppTaskView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_tasks")
    .select("*, assignee:profiles!app_tasks_assignee_id_fkey(*)")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []) as AppTaskView[];
}

export type QueueKind = "github_issue" | "forge_task";

export interface QueueItem {
  kind: QueueKind;
  id: string;
  title: string;
  ref: string | null;
  status: WorkflowStatus;
  priority: TaskPriority;
  githubState: "open" | "closed" | null;
  url: string | null;
  dueDate: string | null;
  projectSlug: string;
  projectName: string;
}

/**
 * The unified personal work queue (Instructions §17): GitHub issues assigned to
 * me + Forge-native tasks assigned to me, across every project I belong to.
 */
export async function getMyQueue(params: {
  userId: string;
  githubLogin: string | null;
}): Promise<QueueItem[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project:projects(id, slug, name)");
  const projects = (memberships ?? [])
    .map((m) => m.project)
    .filter(Boolean) as { id: string; slug: string; name: string }[];

  const items: QueueItem[] = [];

  // Forge-native tasks assigned to me.
  const { data: tasks } = await supabase
    .from("app_tasks")
    .select("*")
    .eq("assignee_id", params.userId);
  for (const t of tasks ?? []) {
    const project = projects.find((p) => p.id === t.project_id);
    if (!project) continue;
    items.push({
      kind: "forge_task",
      id: t.id,
      title: t.title,
      ref: null,
      status: t.status,
      priority: t.priority,
      githubState: null,
      url: `/app/${project.slug}/tasks#${t.id}`,
      dueDate: t.due_date,
      projectSlug: project.slug,
      projectName: project.name,
    });
  }

  // GitHub issues assigned to me (from the cache; GitHub stays authoritative).
  if (params.githubLogin) {
    for (const project of projects) {
      const issues = await listIssues(project.id, {
        state: "all",
        assignee: params.githubLogin,
      });
      for (const issue of issues) {
        items.push({
          kind: "github_issue",
          id: `${project.slug}#${issue.number}`,
          title: issue.title,
          ref: `#${issue.number}`,
          status: issue.workflowStatus,
          priority: issue.priority,
          githubState: issue.githubState,
          url: `/app/${project.slug}/issues/${issue.number}`,
          dueDate: null,
          projectSlug: project.slug,
          projectName: project.name,
        });
      }
    }
  }

  return items;
}

export interface GroupedQueue {
  today: QueueItem[];
  upNext: QueueItem[];
  waiting: QueueItem[];
  done: QueueItem[];
}

export function groupQueue(items: QueueItem[]): GroupedQueue {
  const g: GroupedQueue = { today: [], upNext: [], waiting: [], done: [] };
  for (const item of items) {
    if (item.status === "done" || item.githubState === "closed") {
      g.done.push(item);
    } else if (item.status === "in_progress") {
      g.today.push(item);
    } else if (item.status === "in_review") {
      g.waiting.push(item);
    } else {
      g.upNext.push(item);
    }
  }
  const byPriority = (a: QueueItem, b: QueueItem) =>
    ["none", "low", "medium", "high", "urgent"].indexOf(b.priority) -
    ["none", "low", "medium", "high", "urgent"].indexOf(a.priority);
  g.today.sort(byPriority);
  g.upNext.sort(byPriority);
  g.waiting.sort(byPriority);
  return g;
}
