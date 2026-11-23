"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Github,
  Lock,
  GitBranch,
  Check,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format";
import { createProjectAction } from "@/lib/actions/projects";
import { updateProfileAction } from "@/lib/actions/profile";

interface Repo {
  github_id: number;
  full_name: string;
  owner: string;
  name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  updated_at: string;
  language: string | null;
}

type Phase = "connect" | "choose" | "creating" | "error";

export function ConnectWizard({
  githubLogin,
  allowCancel = false,
}: {
  githubLogin: string | null;
  allowCancel?: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("connect");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selected, setSelected] = useState<Repo | null>(null);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRepos() {
    setLoadingRepos(true);
    setError(null);
    try {
      if (!githubLogin && handle.trim()) {
        const res = await updateProfileAction({ githubUsername: handle.trim() });
        if (!res.ok) {
          setError(res.message);
          setLoadingRepos(false);
          return;
        }
      }
      const res = await fetch("/api/github/repos");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to load repositories");
      setRepos(body.repos);
      setPhase("choose");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load repositories");
      setPhase("error");
    } finally {
      setLoadingRepos(false);
    }
  }

  async function create() {
    if (!selected) return;
    setPhase("creating");
    setError(null);
    const result = await createProjectAction({
      repoFullName: selected.full_name,
      name: name || selected.name,
      description: selected.description ?? undefined,
      isPrivate: selected.private,
      repoGithubId: selected.github_id,
      defaultBranch: selected.default_branch,
    });
    if (result.ok) {
      router.push(`/app/${result.data.slug}/overview`);
      router.refresh();
    } else {
      setError(result.message);
      setPhase("error");
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8 flex items-center justify-between">
        <Logo markClassName="h-6 w-6" className="[&_span]:text-base" />
        {allowCancel && (
          <Button variant="ghost" size="sm" onClick={() => router.push("/app")}>
            Cancel
          </Button>
        )}
      </div>

      <Steps phase={phase} />

      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        {phase === "connect" && (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-border">
              <Github className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              Authorise GitHub
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Forge reads your repositories, issues and pull requests to build
              your workspace.{" "}
              {githubLogin ? (
                <>
                  Signed in as{" "}
                  <span className="font-mono text-foreground">
                    @{githubLogin}
                  </span>
                  .
                </>
              ) : (
                "Your token stays server-side."
              )}
            </p>
            {!githubLogin && (
              <div className="mt-4 text-left">
                <label className="text-xs font-medium text-muted-foreground">
                  Your GitHub username{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="octocat"
                  className="mt-1"
                />
                <p className="mt-1 text-2xs text-muted-foreground">
                  Used so &ldquo;assigned to me&rdquo;, workload and contribution
                  views resolve to you.
                </p>
              </div>
            )}
            <Button
              className="mt-5 w-full"
              onClick={loadRepos}
              disabled={loadingRepos}
            >
              {loadingRepos ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Github />
              )}
              {loadingRepos ? "Contacting GitHub…" : "Continue"}
            </Button>
          </div>
        )}

        {phase === "choose" && (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Connect a repository
              </h2>
              <button
                onClick={loadRepos}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the repository you want Forge to organise.
            </p>

            <div className="mt-4 max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {repos.map((repo) => (
                <button
                  key={repo.github_id}
                  onClick={() => {
                    setSelected(repo);
                    setName(repo.name);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors",
                    selected?.github_id === repo.github_id
                      ? "border-primary bg-selected"
                      : "border-border hover:bg-hover",
                  )}
                >
                  <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-medium text-foreground">
                      {repo.full_name}
                      {repo.private && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </span>
                    {repo.description && (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {repo.description}
                      </span>
                    )}
                    <span className="mt-1 block text-2xs text-muted-foreground/70">
                      {repo.language ? `${repo.language} · ` : ""}updated{" "}
                      {relativeTime(repo.updated_at)}
                    </span>
                  </span>
                  {selected?.github_id === repo.github_id && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>

            {selected && (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <label className="text-xs font-medium text-muted-foreground">
                  Project name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={selected.name}
                />
                <Button className="mt-2 w-full" onClick={create}>
                  Create workspace
                  <ArrowRight />
                </Button>
              </div>
            )}
          </div>
        )}

        {phase === "creating" && (
          <div className="py-6 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <h2 className="mt-4 text-sm font-semibold text-foreground">
              Synchronising {selected?.full_name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pulling issues, pull requests and recent commits from GitHub. This
              only takes a moment.
            </p>
          </div>
        )}

        {phase === "error" && (
          <div className="py-4 text-center">
            <p className="text-sm font-medium text-destructive">
              {error ?? "Something went wrong."}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setPhase("connect")}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Steps({ phase }: { phase: Phase }) {
  const items = [
    { key: "connect", label: "Authorise" },
    { key: "choose", label: "Select repository" },
    { key: "creating", label: "Initial sync" },
  ];
  const activeIndex =
    phase === "connect"
      ? 0
      : phase === "choose"
        ? 1
        : phase === "error"
          ? 1
          : 2;
  return (
    <ol className="flex items-center gap-2 text-xs">
      {items.map((it, i) => (
        <li key={it.key} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border font-mono text-2xs",
              i < activeIndex
                ? "border-primary bg-primary text-primary-foreground"
                : i === activeIndex
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground",
            )}
          >
            {i < activeIndex ? <Check className="h-3 w-3" /> : i + 1}
          </span>
          <span
            className={cn(
              i <= activeIndex ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {it.label}
          </span>
          {i < items.length - 1 && (
            <span className="mx-1 h-px w-6 bg-border" />
          )}
        </li>
      ))}
    </ol>
  );
}
