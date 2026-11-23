import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  GitPullRequest,
  CircleDot,
  Command,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { MarketingIssuePreview } from "@/components/marketing/issue-preview";

export default function LandingPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 forge-grid opacity-60" />
          <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 md:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                GitHub-native project management
              </div>
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                Your project management should live where your code already
                lives.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
                Forge brings GitHub issues, pull requests, commits and team
                workflow into one calm, keyboard-first workspace — without
                forcing you to maintain a second system.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/auth/sign-up">
                    Connect a repository
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Free for solo projects · Team plan for 2+ engineers
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-4xl">
              <MarketingIssuePreview />
            </div>
          </div>
        </section>

        {/* Value props */}
        <section id="features" className="border-t border-border/60 bg-card/30">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
              What Forge adds on top of GitHub
            </h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-card p-6">
                  <f.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  GitHub stays the source of truth
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Forge never pretends. When you create or move an issue, the
                  write goes to GitHub first — only then does Forge update its
                  local cache and your view. Issues, pull requests and commits
                  are mirrored for speed; tasks, workflow columns and messages
                  are Forge&apos;s own.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {STEPS.map((s, i) => (
                    <li key={s} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border font-mono text-2xs text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card p-5 font-mono text-xs leading-relaxed text-muted-foreground">
                <div className="text-foreground">user action</div>
                <div className="pl-2">↓</div>
                <div>Forge server-side API</div>
                <div className="pl-2">↓</div>
                <div>GitHub API — authoritative write</div>
                <div className="pl-2">↓</div>
                <div className="text-success">successful GitHub response</div>
                <div className="pl-2">↓</div>
                <div>update local cache</div>
                <div className="pl-2">↓</div>
                <div className="text-foreground">update UI</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/60 bg-card/30">
          <div className="mx-auto max-w-6xl px-5 py-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Why switch between GitHub, Jira and Slack?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              Bring the workflow to the code. Connect a repository and Forge
              builds your workspace in seconds.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/auth/sign-up">
                Get started
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row">
          <Logo markClassName="h-4 w-4" className="[&_span]:text-xs" />
          <p>A portfolio project — GitHub-native team productivity.</p>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: CircleDot,
    title: "Issues board",
    body: "A Kanban workflow layered on GitHub issues. Forge tracks Todo → In Progress → In Review → Done as metadata; GitHub state stays authoritative.",
  },
  {
    icon: GitPullRequest,
    title: "Pull requests that need you",
    body: "Open PRs surfaced by what's waiting on your review, with CI state, size and the issue each one closes.",
  },
  {
    icon: GitBranch,
    title: "My Tasks",
    body: "One personal queue: GitHub issues assigned to you and Forge-native tasks, grouped into Today, Up next and Waiting.",
  },
  {
    icon: Activity,
    title: "Unified activity",
    body: "GitHub events and Forge events in one feed — opened, merged, moved, committed — so you can see what changed at a glance.",
  },
  {
    icon: Command,
    title: "Command palette",
    body: "⌘K to jump anywhere, search issues, create work or switch projects. Keyboard shortcuts throughout.",
  },
  {
    icon: ShieldCheck,
    title: "Isolated by design",
    body: "Row Level Security on every project-scoped table. You can never reach another project's data by changing an id.",
  },
];

const STEPS = [
  "Sign in and authorise GitHub.",
  "Choose the repository Forge should organise.",
  "Forge runs an initial sync — issues, pull requests, recent commits.",
  "Work from the board, My Tasks and the overview. Sync on demand or on a schedule.",
];
