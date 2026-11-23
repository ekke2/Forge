import type { Metadata } from "next";
import { CheckCircle2, Sun, ArrowRight, Clock } from "lucide-react";
import { requireProjectAccess, getSessionUser } from "@/lib/auth";
import {
  listAppTasks,
  getMyQueue,
  groupQueue,
} from "@/lib/data/tasks";
import { listProjectMembers } from "@/lib/data/projects";
import { PageHeader, PageBody } from "@/components/page-header";
import { QueueItemRow } from "@/components/tasks/queue-item-row";
import { TaskManager } from "@/components/tasks/task-manager";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "My Tasks" };

export default async function TasksPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project: slug } = await params;
  const { project } = await requireProjectAccess(slug);
  const user = await getSessionUser();

  const [allQueue, tasks, members] = await Promise.all([
    getMyQueue({
      userId: user!.id,
      githubLogin: user?.profile?.github_username ?? null,
    }),
    listAppTasks(project.id),
    listProjectMembers(project.id),
  ]);

  const queue = allQueue.filter((i) => i.projectSlug === slug);
  const grouped = groupQueue(queue);
  const memberOptions = members.map((m) => ({
    id: m.user_id,
    name: m.profile?.display_name ?? m.profile?.github_username ?? "Member",
  }));

  const nothing =
    grouped.today.length === 0 &&
    grouped.upNext.length === 0 &&
    grouped.waiting.length === 0;

  return (
    <>
      <PageHeader
        title="My Tasks"
        description="Everything assigned to you — GitHub issues and Forge tasks — in one queue."
      />
      <PageBody className="max-w-4xl space-y-10">
        {nothing ? (
          <EmptyState
            icon={CheckCircle2}
            title="You're clear"
            description="Nothing is currently assigned to you in this project. Pick something up from the board, or create a Forge task below."
          />
        ) : (
          <div className="space-y-8">
            <Group
              icon={Sun}
              title="Today"
              hint="In progress"
              items={grouped.today}
            />
            <Group
              icon={ArrowRight}
              title="Up next"
              hint="Todo"
              items={grouped.upNext}
            />
            <Group
              icon={Clock}
              title="Waiting"
              hint="In review"
              items={grouped.waiting}
            />
          </div>
        )}

        {grouped.done.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-2xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground">
              Recently done ({grouped.done.length})
            </summary>
            <div className="mt-2 space-y-1.5 opacity-70">
              {grouped.done.slice(0, 10).map((item) => (
                <QueueItemRow key={item.id} item={item} />
              ))}
            </div>
          </details>
        )}

        <div className="border-t border-border pt-8">
          <TaskManager
            projectId={project.id}
            tasks={tasks}
            members={memberOptions}
            currentUserId={user!.id}
          />
        </div>
      </PageBody>
    </>
  );
}

function Group({
  icon: Icon,
  title,
  hint,
  items,
}: {
  icon: typeof Sun;
  title: string;
  hint: string;
  items: import("@/lib/data/tasks").QueueItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
        <span className="text-2xs font-normal text-muted-foreground">
          {hint} · {items.length}
        </span>
      </h2>
      <div className="space-y-1.5">
        {items.map((item) => (
          <QueueItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
