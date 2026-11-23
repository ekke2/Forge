import {
  LayoutGrid,
  CircleDot,
  GitPullRequest,
  ListChecks,
  Activity,
  Users,
  MessagesSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  segment: string;
  icon: LucideIcon;
  /** Team-plan only. */
  teamOnly?: boolean;
  shortcut?: string;
}

export const WORKSPACE_NAV: NavItem[] = [
  { key: "overview", label: "Overview", segment: "overview", icon: LayoutGrid, shortcut: "G O" },
  { key: "tasks", label: "My Tasks", segment: "tasks", icon: ListChecks, shortcut: "G M" },
  { key: "issues", label: "Issues", segment: "issues", icon: CircleDot, shortcut: "G I" },
  { key: "pulls", label: "Pull Requests", segment: "pulls", icon: GitPullRequest, shortcut: "G P" },
  { key: "activity", label: "Activity", segment: "activity", icon: Activity },
];

export const TEAM_NAV: NavItem[] = [
  { key: "members", label: "Members", segment: "members", icon: Users },
  { key: "messages", label: "Messages", segment: "messages", icon: MessagesSquare, teamOnly: true },
];

export const PROJECT_NAV: NavItem[] = [
  { key: "settings", label: "Settings", segment: "settings", icon: Settings },
];
