"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SendHorizontal, Lock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { initials, messageTime } from "@/lib/format";
import { postMessageAction } from "@/lib/actions/messages";
import type { MessageView } from "@/lib/data/messages";
import type { MessageChannel } from "@/lib/constants";

interface Target {
  channel?: MessageChannel;
  issueNumber?: number;
}

export function MessageThread({
  projectId,
  projectSlug,
  target,
  initialMessages,
  plan,
  compact = false,
}: {
  projectId: string;
  projectSlug: string;
  target: Target;
  initialMessages: MessageView[];
  plan: "free" | "team";
  compact?: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMessages(initialMessages), [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Realtime: new messages for this project, filtered to this thread.
  useEffect(() => {
    if (plan !== "team") return;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${projectId}:${target.channel ?? `issue-${target.issueNumber}`}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${projectId}`,
        },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, target.channel, target.issueNumber, plan, router]);

  if (plan === "free") {
    return (
      <EmptyState
        icon={Lock}
        title="Team messaging is a Team-plan feature"
        description="Upgrade to discuss work in shared channels and issue threads."
        action={
          <Button asChild size="sm">
            <Link href={`/app/${projectSlug}/settings`}>View plans</Link>
          </Button>
        }
      />
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const res = await postMessageAction(projectId, {
      body: draft.trim(),
      channel: target.channel,
      issueNumber: target.issueNumber,
    });
    setSending(false);
    if (res.ok) {
      setDraft("");
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="flex flex-col">
      <div
        className={
          compact
            ? "max-h-80 space-y-4 overflow-y-auto pr-1"
            : "flex-1 space-y-4 pr-1"
        }
      >
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-2.5">
              <Avatar className="mt-0.5 h-7 w-7">
                {m.author.avatarUrl && (
                  <AvatarImage src={m.author.avatarUrl} alt="" />
                )}
                <AvatarFallback>{initials(m.author.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs">
                  <span className="font-medium text-foreground">
                    {m.author.name}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    {messageTime(m.createdAt)}
                  </span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground/90">
                  {m.body}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(e);
          }}
          placeholder="Write a message…  (⌘↵ to send)"
          rows={compact ? 2 : 3}
          className="min-h-0 resize-none"
        />
        <Button type="submit" size="icon" disabled={sending || !draft.trim()}>
          <SendHorizontal />
        </Button>
      </form>
    </div>
  );
}
