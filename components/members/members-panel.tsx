"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Loader2, MoreHorizontal, Lock, Crown } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import {
  inviteMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/lib/actions/members";
import { FREE_PLAN_MEMBER_LIMIT } from "@/lib/constants";

export interface MemberCard {
  userId: string;
  name: string;
  login: string | null;
  avatarUrl: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  isOwner: boolean;
  openIssues: number;
  reviewRequests: number;
  stats: {
    commits: number;
    prs_opened: number;
    prs_merged: number;
    issues_closed: number;
    reviews: number;
  } | null;
}

export function MembersPanel({
  projectId,
  projectSlug,
  members,
  plan,
  viewerRole,
}: {
  projectId: string;
  projectSlug: string;
  members: MemberCard[];
  plan: "free" | "team";
  viewerRole: "owner" | "admin" | "member" | "viewer";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviting, setInviting] = useState(false);

  const canManage = viewerRole === "owner" || viewerRole === "admin";
  const atFreeLimit =
    plan === "free" && members.length >= FREE_PLAN_MEMBER_LIMIT;

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    const res = await inviteMemberAction(projectId, { email: email.trim(), role });
    setInviting(false);
    if (res.ok) {
      toast.success("Member added");
      setEmail("");
      startTransition(() => router.refresh());
    } else if (res.error === "upgrade_required") {
      toast.error("Upgrade required", { description: res.message });
    } else {
      toast.error(res.message);
    }
  }

  async function changeRole(userId: string, next: "admin" | "member" | "viewer") {
    const res = await updateMemberRoleAction(projectId, userId, next);
    if (res.ok) startTransition(() => router.refresh());
    else toast.error(res.message);
  }

  async function remove(userId: string) {
    const res = await removeMemberAction(projectId, userId);
    if (res.ok) {
      toast.success("Member removed");
      startTransition(() => router.refresh());
    } else toast.error(res.message);
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Invite a teammate</h2>
          {atFreeLimit ? (
            <div className="mt-2 flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="text-xs">
                <p className="font-medium text-foreground">
                  The Free plan is limited to one member.
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Upgrade to Team to invite the rest of your engineers.
                </p>
                <Button asChild size="xs" className="mt-2">
                  <Link href={`/app/${projectSlug}/settings`}>Upgrade to Team</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={invite} className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="h-8 w-56 text-xs"
              />
              <Select
                value={role}
                onValueChange={(v) => setRole(v as typeof role)}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" size="sm" disabled={inviting}>
                {inviting ? <Loader2 className="animate-spin" /> : <UserPlus />}
                Invite
              </Button>
              <p className="w-full text-2xs text-muted-foreground">
                They must have signed in to Forge at least once — this is a
                simulated invite, no e-mail is sent.
              </p>
            </form>
          )}
        </div>
      )}

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
            <Avatar className="h-8 w-8">
              {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
              <AvatarFallback>{initials(m.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {m.name}
                {m.isOwner && <Crown className="h-3 w-3 text-warning" />}
              </p>
              <p className="text-2xs text-muted-foreground">
                {m.login ? `@${m.login} · ` : ""}
                {m.role}
              </p>
            </div>

            <div className="hidden gap-6 text-center text-2xs text-muted-foreground sm:flex">
              <Stat label="Open" value={m.openIssues} />
              <Stat label="To review" value={m.reviewRequests} />
              {m.stats && (
                <>
                  <Stat label="Commits" value={m.stats.commits} />
                  <Stat label="PRs merged" value={m.stats.prs_merged} />
                  <Stat label="Reviews" value={m.stats.reviews} />
                </>
              )}
            </div>

            {canManage && !m.isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {viewerRole === "owner" && (
                    <>
                      <DropdownMenuItem
                        onSelect={() => changeRole(m.userId, "admin")}
                      >
                        Make admin
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => changeRole(m.userId, "member")}
                      >
                        Make member
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => changeRole(m.userId, "viewer")}
                      >
                        Make viewer
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem
                    onSelect={() => remove(m.userId)}
                    className="text-destructive"
                  >
                    Remove from project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>
      <p className="text-2xs text-muted-foreground">
        Contribution counts are drawn from synced GitHub activity for context —
        they are not a performance measure.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="tabular-nums text-sm font-medium text-foreground">{value}</p>
      <p>{label}</p>
    </div>
  );
}
