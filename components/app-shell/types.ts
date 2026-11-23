import type { Database } from "@/lib/database.types";

export interface ShellProject {
  id: string;
  slug: string;
  name: string;
  repoFullName: string;
  plan: Database["public"]["Enums"]["project_plan"];
  role: Database["public"]["Enums"]["member_role"];
  memberCount: number;
}

export interface ShellUser {
  id: string;
  name: string;
  email: string | null;
  login: string | null;
  avatarUrl: string | null;
}
