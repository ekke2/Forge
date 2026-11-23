import type { Metadata } from "next";
import Link from "next/link";
import { Hash, Lock } from "lucide-react";
import { requireProjectAccess } from "@/lib/auth";
import { listChannelMessages } from "@/lib/data/messages";
import { MESSAGE_CHANNELS, type MessageChannel } from "@/lib/constants";
import { PageHeader, PageBody } from "@/components/page-header";
import { MessageThread } from "@/components/messages/message-thread";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { project: slug } = await params;
  const { c } = await searchParams;
  const { project } = await requireProjectAccess(slug);

  const channel: MessageChannel = MESSAGE_CHANNELS.includes(
    c as MessageChannel,
  )
    ? (c as MessageChannel)
    : "general";

  if (project.plan === "free") {
    return (
      <>
        <PageHeader title="Messages" />
        <PageBody className="max-w-2xl">
          <EmptyState
            icon={Lock}
            title="Team messaging is a Team-plan feature"
            description="Upgrade to talk through work in shared channels and issue threads, powered by Supabase Realtime."
            action={
              <Button asChild size="sm">
                <Link href={`/app/${slug}/settings`}>View plans</Link>
              </Button>
            }
          />
        </PageBody>
      </>
    );
  }

  const messages = await listChannelMessages(project.id, channel);

  return (
    <>
      <PageHeader title="Messages" description="Lightweight project chat.">
        <div className="flex gap-1">
          {MESSAGE_CHANNELS.map((ch) => (
            <Link
              key={ch}
              href={`/app/${slug}/messages?c=${ch}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                channel === ch
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-hover",
              )}
            >
              <Hash className="h-3 w-3" />
              {ch}
            </Link>
          ))}
        </div>
      </PageHeader>

      <PageBody className="flex max-w-3xl flex-col">
        <div className="rounded-lg border border-border bg-card p-4">
          <MessageThread
            projectId={project.id}
            projectSlug={slug}
            target={{ channel }}
            initialMessages={messages}
            plan={project.plan}
          />
        </div>
      </PageBody>
    </>
  );
}
