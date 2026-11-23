import type {
  GitHubCommit,
  GitHubIssue,
  GitHubPull,
  GitHubRepo,
  GitHubReview,
  GitHubActor,
} from "@/lib/github/types";

/* -------------------------------------------------------------------------- */
/* Deterministic RNG                                                          */
/* -------------------------------------------------------------------------- */

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Rng {
  private next: () => number;
  constructor(seed: string) {
    const s = xmur3(seed);
    this.next = mulberry32(s());
  }
  float() {
    return this.next();
  }
  int(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  bool(p = 0.5) {
    return this.next() < p;
  }
  sample<T>(arr: readonly T[], count: number): T[] {
    const copy = [...arr];
    const out: T[] = [];
    while (out.length < count && copy.length) {
      out.push(copy.splice(Math.floor(this.next() * copy.length), 1)[0]);
    }
    return out;
  }
}

/* -------------------------------------------------------------------------- */
/* Content pools                                                             */
/* -------------------------------------------------------------------------- */

const PEOPLE: { login: string; name: string }[] = [
  { login: "adriaan", name: "Adriaan Coetzee" },
  { login: "sarahchen", name: "Sarah Chen" },
  { login: "jdlv", name: "James de la Vega" },
  { login: "mariapetrova", name: "Maria Petrova" },
  { login: "kwabena", name: "Kwabena Mensah" },
  { login: "yukihiro", name: "Yuki Tanaka" },
  { login: "priyan", name: "Priya Nair" },
  { login: "tomasz", name: "Tomasz Wójcik" },
];

const LABELS = [
  { name: "bug", color: "e11d48" },
  { name: "feature", color: "4f46e5" },
  { name: "enhancement", color: "0ea5e9" },
  { name: "documentation", color: "64748b" },
  { name: "good first issue", color: "10b981" },
  { name: "performance", color: "f59e0b" },
  { name: "security", color: "9333ea" },
  { name: "tech-debt", color: "78716c" },
  { name: "blocked", color: "dc2626" },
  { name: "needs-design", color: "ec4899" },
];

const AREAS = [
  "authentication",
  "billing",
  "onboarding",
  "the issues board",
  "the sync engine",
  "the command palette",
  "dark mode",
  "the activity feed",
  "pull request review",
  "the API rate limiter",
  "the dashboard",
  "webhook processing",
  "the diff viewer",
  "mobile navigation",
  "the settings page",
];

const BUG_TEMPLATES = [
  "Fix OAuth callback redirect losing the `next` param",
  "Race condition when two syncs run concurrently",
  "Issue cards flicker on drag in Safari",
  "Rate-limit banner never clears after a successful retry",
  "Timezone drift in the activity feed timestamps",
  "Board column counts wrong after moving the last card",
  "Markdown code fences not rendering language in issue body",
  "Session randomly dropped when opening a PR in a new tab",
  "Avatar images 404 for users without a GitHub avatar",
  "Keyboard shortcut `c` fires while typing in the comment box",
  "Duplicate activity rows created on repeated manual sync",
  "Empty state shows briefly before cached data loads",
];

const FEATURE_TEMPLATES = [
  "Add saved filters to the issues list",
  "Support assigning issues to multiple people from the board",
  "Inline PR review comments with threads",
  "Contribution trends chart on the members page",
  "Bulk-move issues between workflow columns",
  "Keyboard-only navigation for the command palette results",
  "Per-project notification preferences",
  "Slack-style unread indicators for message channels",
  "Link a Forge task to an existing GitHub issue",
  "Scheduled sync configuration in project settings",
  "Show CI check details in the PR side panel",
  "Milestone grouping on the overview page",
];

const CHORE_TEMPLATES = [
  "Extract the sync engine into a testable module",
  "Upgrade to the new Supabase SSR cookie API",
  "Consolidate duplicated badge components",
  "Add RLS regression tests for project isolation",
  "Document the GitHub-owned vs Forge-owned data model",
  "Replace ad-hoc fetch calls with the data layer",
  "Tighten TypeScript config: no implicit any in lib/",
];

const COMMIT_VERBS = [
  "Fix",
  "Add",
  "Refactor",
  "Tidy",
  "Wire up",
  "Handle",
  "Guard against",
  "Cache",
  "Simplify",
  "Document",
];
const COMMIT_OBJECTS = [
  "OAuth callback",
  "sync run bookkeeping",
  "board column ordering",
  "rate-limit backoff",
  "issue label rendering",
  "PR review decision mapping",
  "empty-state copy",
  "activity dedupe key",
  "command palette actions",
  "workload aggregation query",
  "skeleton loaders",
  "dark-mode token contrast",
];

/* -------------------------------------------------------------------------- */
/* Generation                                                               */
/* -------------------------------------------------------------------------- */

const DAY = 86_400_000;

function avatar(login: string) {
  // Deterministic, offline-friendly identicon service is avoided; GitHub's
  // identicon endpoint works for any string and is on the allowed image host.
  return `https://avatars.githubusercontent.com/u/${
    (login.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 90000) + 1000
  }?v=4`;
}

export interface MockDataset {
  repo: GitHubRepo;
  people: (GitHubActor & { name: string })[];
  issues: GitHubIssue[];
  pulls: GitHubPull[];
  reviews: GitHubReview[];
  commits: GitHubCommit[];
}

export interface DatasetOptions {
  /** The connected repo, e.g. "acme/orbit". */
  repoFullName: string;
  /** Stable seed — pass the project id so a project's world never shifts. */
  seed: string;
  /**
   * GitHub handle of the Forge user, mixed into the cast so "assigned to me"
   * and "your review is requested" have something to show.
   */
  viewerLogin?: string | null;
  now?: number;
}

export function buildDataset(opts: DatasetOptions): MockDataset {
  const now = opts.now ?? Date.now();
  const rng = new Rng(`${opts.seed}:${opts.repoFullName}`);
  const [owner, name] = opts.repoFullName.split("/");

  const cast = [...PEOPLE];
  if (opts.viewerLogin) {
    const handle = opts.viewerLogin.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (handle && !cast.some((p) => p.login === handle)) {
      cast.unshift({ login: handle, name: "You" });
    }
  }
  const people: (GitHubActor & { name: string })[] = cast.map((p) => ({
    login: p.login,
    name: p.name,
    avatar_url: avatar(p.login),
  }));
  const actor = (p: { login: string }): GitHubActor => ({
    login: p.login,
    avatar_url: avatar(p.login),
  });

  const ISSUE_COUNT = rng.int(34, 52);
  const PR_COUNT = rng.int(12, 20);
  const COMMIT_COUNT = rng.int(90, 150);

  /* Issues ---------------------------------------------------------------- */
  const titlePool = [
    ...BUG_TEMPLATES.map((t) => ({ t, kind: "bug" as const })),
    ...FEATURE_TEMPLATES.map((t) => ({ t, kind: "feature" as const })),
    ...CHORE_TEMPLATES.map((t) => ({ t, kind: "chore" as const })),
  ];

  const issues: GitHubIssue[] = [];
  for (let i = 0; i < ISSUE_COUNT; i++) {
    const number = i + 1;
    const base = titlePool[i % titlePool.length];
    const createdOffset = rng.int(2, 90);
    const created = now - createdOffset * DAY - rng.int(0, DAY);
    const closed = rng.bool(0.52);
    const updated = closed
      ? created + rng.int(1, createdOffset) * DAY
      : now - rng.int(0, 6) * DAY - rng.int(0, DAY);
    const author = rng.pick(people);
    const assignees = rng.bool(0.7) ? rng.sample(people, rng.int(1, 2)) : [];
    const labels = rng.sample(
      LABELS,
      rng.int(base.kind === "bug" ? 1 : 0, 3),
    );
    if (base.kind === "bug" && !labels.some((l) => l.name === "bug")) {
      labels.unshift(LABELS[0]);
    }
    issues.push({
      github_id: 3_000_000 + i,
      number,
      title: base.t,
      body: issueBody(base.t, base.kind, rng),
      state: closed ? "closed" : "open",
      state_reason: closed ? (rng.bool(0.85) ? "completed" : "not_planned") : null,
      author: actor(author),
      assignees: assignees.map(actor),
      labels,
      comments_count: rng.int(0, 14),
      milestone_title: rng.bool(0.3) ? rng.pick(["v1.0", "v1.1", "Backlog"]) : null,
      html_url: `https://github.com/${opts.repoFullName}/issues/${number}`,
      created_at: new Date(created).toISOString(),
      updated_at: new Date(updated).toISOString(),
      closed_at: closed ? new Date(updated).toISOString() : null,
    });
  }

  /* Pull requests ------------------------------------------------------- */
  const pulls: GitHubPull[] = [];
  const reviews: GitHubReview[] = [];
  let prNumberCursor = ISSUE_COUNT + 1;
  for (let i = 0; i < PR_COUNT; i++) {
    const number = prNumberCursor++;
    const author = rng.pick(people);
    const createdOffset = rng.int(1, 40);
    const created = now - createdOffset * DAY - rng.int(0, DAY);
    const roll = rng.float();
    const state: GitHubPull["state"] =
      roll < 0.5 ? "merged" : roll < 0.62 ? "closed" : "open";
    const merged = state === "merged";
    const updated = merged
      ? created + rng.int(1, Math.max(1, createdOffset - 1)) * DAY
      : now - rng.int(0, 4) * DAY - rng.int(0, DAY);
    const draft = state === "open" && rng.bool(0.2);
    const linkedIssue =
      rng.bool(0.6) ? issues[rng.int(0, issues.length - 1)].number : null;
    const reviewers = rng.sample(
      people.filter((p) => p.login !== author.login),
      rng.int(1, 2),
    );
    const additions = rng.int(12, 640);
    const deletions = rng.int(2, Math.max(4, additions / 2));
    const decision: GitHubPull["review_decision"] = merged
      ? "approved"
      : draft
        ? null
        : rng.pick(["approved", "changes_requested", "review_required", null]);
    const ci: GitHubPull["ci_state"] = merged
      ? "success"
      : rng.pick(["success", "success", "pending", "failure", "unknown"]);

    pulls.push({
      github_id: 5_000_000 + i,
      number,
      title: prTitle(rng),
      body: prBody(linkedIssue, rng),
      state,
      draft,
      author: actor(author),
      base_ref: "main",
      head_ref: `${rng.pick(["fix", "feat", "chore", "refactor"])}/${rng
        .pick(AREAS)
        .replace(/^the /, "")
        .replace(/\s+/g, "-")}`,
      additions,
      deletions,
      changed_files: rng.int(1, 18),
      commits_count: rng.int(1, 12),
      comments_count: rng.int(0, 9),
      review_decision: decision,
      ci_state: ci,
      requested_reviewers:
        state === "open" && decision !== "approved"
          ? reviewers.map(actor)
          : [],
      labels: rng.sample(LABELS, rng.int(0, 2)),
      linked_issue_number: linkedIssue,
      html_url: `https://github.com/${opts.repoFullName}/pull/${number}`,
      created_at: new Date(created).toISOString(),
      updated_at: new Date(updated).toISOString(),
      merged_at: merged ? new Date(updated).toISOString() : null,
    });

    for (const r of reviewers) {
      if (state === "open" && decision === "review_required" && rng.bool(0.5)) {
        continue;
      }
      reviews.push({
        github_id: 7_000_000 + reviews.length,
        pr_number: number,
        reviewer: actor(r),
        state: merged
          ? "approved"
          : rng.pick([
              "approved",
              "changes_requested",
              "commented",
              "commented",
            ]),
        body: rng.pick([
          "Looks good — one nit on naming.",
          "Can we add a test for the concurrent case?",
          "Nice. Approving once CI is green.",
          "This changes the RLS surface — double-checked, isolation holds.",
          null,
        ]),
        submitted_at: new Date(
          created + rng.int(1, 5) * (DAY / 2),
        ).toISOString(),
      });
    }
  }

  /* Commits ----------------------------------------------------------------- */
  const commits: GitHubCommit[] = [];
  for (let i = 0; i < COMMIT_COUNT; i++) {
    const author = rng.pick(people);
    const authoredAt = now - rng.int(0, 90) * DAY - rng.int(0, DAY);
    const sha = hex(rng, 40);
    commits.push({
      sha,
      message: `${rng.pick(COMMIT_VERBS)} ${rng.pick(COMMIT_OBJECTS)}${
        rng.bool(0.25) ? `\n\nRefs #${rng.int(1, ISSUE_COUNT)}` : ""
      }`,
      author: actor(author),
      author_name: author.name,
      authored_at: new Date(authoredAt).toISOString(),
      additions: rng.int(1, 240),
      deletions: rng.int(0, 120),
      html_url: `https://github.com/${opts.repoFullName}/commit/${sha}`,
    });
  }
  commits.sort((a, b) => b.authored_at.localeCompare(a.authored_at));

  const openIssues = issues.filter((i) => i.state === "open").length;
  const repo: GitHubRepo = {
    github_id: Math.abs(hashCode(opts.repoFullName)),
    owner,
    name,
    full_name: opts.repoFullName,
    description: repoBlurb(name, rng),
    private: rng.bool(0.4),
    default_branch: "main",
    html_url: `https://github.com/${opts.repoFullName}`,
    open_issues_count: openIssues,
    stargazers_count: rng.int(3, 480),
    pushed_at: commits[0]?.authored_at ?? new Date(now).toISOString(),
  };

  return { repo, people, issues, pulls, reviews, commits };
}

/* -------------------------------------------------------------------------- */
/* Text helpers                                                             */
/* -------------------------------------------------------------------------- */

function hex(rng: Rng, len: number) {
  let s = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < len; i++) s += chars[rng.int(0, 15)];
  return s;
}

function hashCode(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

function repoBlurb(name: string, rng: Rng) {
  return rng.pick([
    `${name} — the internal platform for shipping faster.`,
    `Core services and web client for ${name}.`,
    `${name}: developer tooling and workflow automation.`,
    `Monorepo for the ${name} product suite.`,
  ]);
}

function issueBody(
  title: string,
  kind: "bug" | "feature" | "chore",
  rng: Rng,
): string {
  if (kind === "bug") {
    return [
      `### What happened`,
      ``,
      `${title.replace(/^Fix /, "")}. Reproduced on \`main\` at ${hex(rng, 7)}.`,
      ``,
      `### Steps to reproduce`,
      ``,
      `1. Sign in with GitHub`,
      `2. Open the affected screen`,
      `3. Observe the incorrect behaviour`,
      ``,
      `### Expected`,
      ``,
      `The UI should stay consistent with the cached data and recover cleanly.`,
    ].join("\n");
  }
  if (kind === "feature") {
    return [
      `### Problem`,
      ``,
      `Users have asked for this repeatedly during onboarding calls.`,
      ``,
      `### Proposal`,
      ``,
      `${title}. Keep it scoped — no schema changes beyond an index, reuse the`,
      `existing data layer, and make sure it degrades gracefully when GitHub is`,
      `unavailable.`,
      ``,
      `### Out of scope`,
      ``,
      `- Realtime updates`,
      `- Bulk operations`,
    ].join("\n");
  }
  return [
    `${title}.`,
    ``,
    `No user-visible change. This is about keeping the codebase honest as it`,
    `grows — smaller modules, clearer boundaries between GitHub-owned and`,
    `Forge-owned data, and tests around project isolation.`,
  ].join("\n");
}

function prTitle(rng: Rng) {
  const verb = rng.pick(["Fix", "Add", "Refactor", "Improve", "Wire up"]);
  return `${verb} ${rng.pick(AREAS)}`;
}

function prBody(linkedIssue: number | null, rng: Rng) {
  return [
    rng.pick([
      "Small, focused change.",
      "Ready for review.",
      "Splitting this out of the larger refactor.",
    ]),
    ``,
    linkedIssue ? `Closes #${linkedIssue}` : `No linked issue.`,
    ``,
    `### Notes`,
    `- Server-side write path only; GitHub stays authoritative`,
    `- Added a skeleton state so there's no layout shift`,
  ].join("\n");
}
