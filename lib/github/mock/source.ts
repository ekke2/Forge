import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type {
  CreateIssueInput,
  GitHubDiffFile,
  GitHubIssue,
  GitHubSource,
  RepoSummaryForConnect,
  UpdateIssueInput,
} from "@/lib/github/types";
import { buildDataset, type MockDataset } from "@/lib/github/mock/dataset";

type Db = SupabaseClient<Database>;

interface MockSourceCtx {
  admin: Db;
  projectId: string;
  repoFullName: string;
  seed: string;
  viewerLogin?: string | null;
}

/**
 * Offline GitHub source. Serves a deterministic dataset for `repoFullName`
 * (seeded so a project's world is stable), and persists issues created or
 * edited through Forge into `github_mock_overrides` so the
 * "GitHub is authoritative" round-trip still holds across requests and syncs.
 */
export class MockGitHubSource implements GitHubSource {
  private dataset: MockDataset;
  constructor(private ctx: MockSourceCtx) {
    this.dataset = buildDataset({
      repoFullName: ctx.repoFullName,
      seed: ctx.seed,
      viewerLogin: ctx.viewerLogin,
    });
  }

  async listConnectableRepos(): Promise<RepoSummaryForConnect[]> {
    const owner =
      (this.ctx.viewerLogin || "acme").toLowerCase().replace(/[^a-z0-9-]/g, "") ||
      "acme";
    const now = Date.now();
    const defs: [string, string, boolean, boolean][] = [
      ["orbit", "Customer-facing web app and marketing site", false, true],
      ["atlas", "Internal platform services and job runners", true, false],
      ["pulse", "Analytics pipeline and dashboards", true, true],
      ["forge-web", "Design system and component library", false, false],
      ["mobile", "React Native client for iOS and Android", true, false],
      ["infra", "Terraform, CI pipelines and deploy tooling", true, false],
    ];
    return defs.map(([name, description, priv, hasLang], i) => ({
      github_id: 900_000 + i,
      full_name: `${owner}/${name}`,
      owner,
      name,
      description,
      private: priv,
      default_branch: "main",
      updated_at: new Date(now - i * 3_600_000 * 7).toISOString(),
      language: hasLang ? ["TypeScript", "Go", "Python"][i % 3] : null,
    }));
  }

  private async overrides(): Promise<Map<number, GitHubIssue>> {
    const { data } = await this.ctx.admin
      .from("github_mock_overrides")
      .select("number,payload")
      .eq("project_id", this.ctx.projectId)
      .eq("kind", "issue");
    const map = new Map<number, GitHubIssue>();
    for (const row of data ?? []) {
      map.set(row.number, row.payload as unknown as GitHubIssue);
    }
    return map;
  }

  async getRepo() {
    return this.dataset.repo;
  }

  async listIssues(): Promise<GitHubIssue[]> {
    const overrides = await this.overrides();
    const merged = this.dataset.issues.map((i) => overrides.get(i.number) ?? i);
    for (const [number, issue] of overrides) {
      if (!merged.some((m) => m.number === number)) merged.push(issue);
    }
    return merged.sort((a, b) => b.number - a.number);
  }

  async listPulls() {
    return this.dataset.pulls;
  }
  async listReviews() {
    return this.dataset.reviews;
  }
  async listCommits() {
    return this.dataset.commits;
  }

  async getPullDiff(prNumber: number): Promise<GitHubDiffFile[]> {
    const pr = this.dataset.pulls.find((p) => p.number === prNumber);
    const fileCount = Math.max(1, Math.min(pr?.changed_files ?? 3, 6));
    const names = [
      "lib/sync/engine.ts",
      "components/board/kanban-column.tsx",
      "app/app/[project]/issues/page.tsx",
      "lib/data/issues.ts",
      "lib/github/mock/source.ts",
      "README.md",
    ];
    return Array.from({ length: fileCount }, (_, idx) => {
      const additions = 4 + ((prNumber * 7 + idx * 13) % 40);
      const deletions = (prNumber + idx * 5) % 12;
      return {
        filename: names[idx % names.length],
        status: idx === 0 ? "modified" : idx % 3 === 0 ? "added" : "modified",
        additions,
        deletions,
        patch: samplePatch(names[idx % names.length], additions, deletions),
      } satisfies GitHubDiffFile;
    });
  }

  async createIssue(input: CreateIssueInput): Promise<GitHubIssue> {
    const all = await this.listIssues();
    const number = Math.max(0, ...all.map((i) => i.number)) + 1;
    const nowIso = new Date().toISOString();
    const viewer = this.ctx.viewerLogin?.toLowerCase() ?? "adriaan";
    const person = this.dataset.people.find((p) => p.login === viewer) ??
      this.dataset.people[0];
    const issue: GitHubIssue = {
      github_id: 3_900_000 + number,
      number,
      title: input.title,
      body: input.body ?? null,
      state: "open",
      state_reason: null,
      author: { login: person.login, avatar_url: person.avatar_url },
      assignees: (input.assignees ?? [])
        .map((login) => this.dataset.people.find((p) => p.login === login))
        .filter(Boolean)
        .map((p) => ({ login: p!.login, avatar_url: p!.avatar_url })),
      labels: (input.labels ?? []).map((name) => ({ name, color: "4f46e5" })),
      comments_count: 0,
      milestone_title: null,
      html_url: `https://github.com/${this.ctx.repoFullName}/issues/${number}`,
      created_at: nowIso,
      updated_at: nowIso,
      closed_at: null,
    };
    await this.persist(number, issue);
    return issue;
  }

  async updateIssue(
    number: number,
    input: UpdateIssueInput,
  ): Promise<GitHubIssue> {
    const all = await this.listIssues();
    const current = all.find((i) => i.number === number);
    if (!current) throw new Error(`Issue #${number} not found`);
    const next: GitHubIssue = {
      ...current,
      title: input.title ?? current.title,
      body: input.body ?? current.body,
      state: input.state ?? current.state,
      closed_at:
        input.state === "closed"
          ? new Date().toISOString()
          : input.state === "open"
            ? null
            : current.closed_at,
      assignees: input.assignees
        ? input.assignees
            .map((login) => this.dataset.people.find((p) => p.login === login))
            .filter(Boolean)
            .map((p) => ({ login: p!.login, avatar_url: p!.avatar_url }))
        : current.assignees,
      labels: input.labels
        ? input.labels.map(
            (name) =>
              current.labels.find((l) => l.name === name) ?? {
                name,
                color: "64748b",
              },
          )
        : current.labels,
      updated_at: new Date().toISOString(),
    };
    await this.persist(number, next);
    return next;
  }

  private async persist(number: number, payload: GitHubIssue) {
    await this.ctx.admin.from("github_mock_overrides").upsert(
      {
        project_id: this.ctx.projectId,
        kind: "issue",
        number,
        payload: payload as unknown as Database["public"]["Tables"]["github_mock_overrides"]["Row"]["payload"],
      },
      { onConflict: "project_id,kind,number" },
    );
  }
}

function samplePatch(filename: string, additions: number, deletions: number) {
  const ext = filename.split(".").pop();
  const lines: string[] = [`@@ -1,${4 + deletions} +1,${4 + additions} @@`];
  lines.push(" // context line — unchanged");
  for (let i = 0; i < Math.min(deletions, 4); i++) {
    lines.push(`-  const stale = legacyLookup(${i});`);
  }
  for (let i = 0; i < Math.min(additions, 8); i++) {
    lines.push(
      ext === "md"
        ? `+ Added documentation paragraph ${i + 1}.`
        : `+  const fresh = cache.get(key${i}) ?? load(key${i});`,
    );
  }
  lines.push(" // context line — unchanged");
  return lines.join("\n");
}
