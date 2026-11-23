"use client";

import { createContext, useContext } from "react";
import type { Database } from "@/lib/database.types";

export interface ProjectContextValue {
  id: string;
  slug: string;
  name: string;
  plan: Database["public"]["Enums"]["project_plan"];
  role: Database["public"]["Enums"]["member_role"];
  repoFullName: string;
  canManage: boolean;
}

const Ctx = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  value,
  children,
}: {
  value: ProjectContextValue;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProject() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProject must be used inside <ProjectProvider>");
  return v;
}
