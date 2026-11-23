import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export interface MessageView {
  id: string;
  body: string;
  createdAt: string;
  channel: string | null;
  issueNumber: number | null;
  author: {
    id: string;
    name: string;
    login: string | null;
    avatarUrl: string | null;
  };
}

type Row = Database["public"]["Tables"]["messages"]["Row"] & {
  author: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

function toView(row: Row): MessageView {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    channel: row.channel,
    issueNumber: row.issue_number,
    author: {
      id: row.author_id,
      name: row.author?.display_name ?? row.author?.github_username ?? "Someone",
      login: row.author?.github_username ?? null,
      avatarUrl: row.author?.avatar_url ?? null,
    },
  };
}

export async function listChannelMessages(
  projectId: string,
  channel: string,
): Promise<MessageView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*, author:profiles(*)")
    .eq("project_id", projectId)
    .eq("channel", channel)
    .order("created_at", { ascending: true })
    .limit(200);
  return ((data ?? []) as Row[]).map(toView);
}

export async function listIssueMessages(
  projectId: string,
  issueNumber: number,
): Promise<MessageView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*, author:profiles(*)")
    .eq("project_id", projectId)
    .eq("issue_number", issueNumber)
    .order("created_at", { ascending: true });
  return ((data ?? []) as Row[]).map(toView);
}
