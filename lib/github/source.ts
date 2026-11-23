import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { GitHubSource } from "@/lib/github/types";
import { MockGitHubSource } from "@/lib/github/mock/source";
import { OctokitGitHubSource } from "@/lib/github/octokit-source";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

function mode(project?: Pick<ProjectRow, "github_mode">): "mock" | "live" {
  const env = process.env.GITHUB_MODE;
  if (project?.github_mode === "live" || env === "live") return "live";
  return "mock";
}

interface ProjectSourceArgs {
  project: ProjectRow;
  admin: SupabaseClient<Database>;
  viewerLogin?: string | null;
  /** Required in live mode: the user's GitHub OAuth token. */
  token?: string | null;
}

/** GitHub source bound to a connected project (used by sync + write paths). */
export function getGitHubSource(args: ProjectSourceArgs): GitHubSource {
  if (mode(args.project) === "live") {
    if (!args.token) {
      throw new Error(
        "GITHUB_MODE=live but no GitHub token is available for this user. Reconnect GitHub.",
      );
    }
    return new OctokitGitHubSource({
      token: args.token,
      repoOwner: args.project.repo_owner,
      repoName: args.project.repo_name,
    });
  }
  return new MockGitHubSource({
    admin: args.admin,
    projectId: args.project.id,
    repoFullName: args.project.repo_full_name,
    seed: args.project.id,
    viewerLogin: args.viewerLogin,
  });
}

interface UserSourceArgs {
  admin: SupabaseClient<Database>;
  viewerLogin?: string | null;
  token?: string | null;
}

/**
 * GitHub source for the connect wizard, before a project exists. Only
 * `listConnectableRepos()` is meaningful here.
 */
export function getGitHubSourceForUser(args: UserSourceArgs): GitHubSource {
  if (mode() === "live" && args.token) {
    return new OctokitGitHubSource({
      token: args.token,
      repoOwner: "",
      repoName: "",
    });
  }
  return new MockGitHubSource({
    admin: args.admin,
    projectId: "00000000-0000-0000-0000-000000000000",
    repoFullName: `${args.viewerLogin ?? "acme"}/placeholder`,
    seed: "connect-wizard",
    viewerLogin: args.viewerLogin,
  });
}
