export const APP_NAME = "Forge";

/** Simulated paygate (Instructions: "paygate for a software team, 2+ members"). */
export const PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "For solo developers organising a single project.",
    seats: 1,
    features: [
      "1 connected repository",
      "Issues, board & issue detail",
      "My Tasks & Forge-native tasks",
      "Manual & scheduled sync",
    ],
  },
  team: {
    id: "team" as const,
    name: "Team",
    price: "$8",
    cadence: "per member / month",
    blurb: "For software teams of two or more working together.",
    seats: 50,
    features: [
      "Everything in Free",
      "Invite unlimited teammates",
      "Team messaging & issue threads",
      "Contribution analytics",
      "Workload & review dashboards",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

/** A project on the Free plan may only have this many members. */
export const FREE_PLAN_MEMBER_LIMIT = 1;

/** Feature keys gated behind the Team plan. */
export const TEAM_FEATURES = {
  invite_members: "Inviting teammates",
  messaging: "Team messaging",
  analytics: "Contribution analytics",
} as const;
export type TeamFeature = keyof typeof TEAM_FEATURES;

export const MESSAGE_CHANNELS = ["general", "development", "random"] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export const SYNC_STALE_AFTER_MS = 15 * 60 * 1000;

/** Keyboard shortcuts surfaced in tooltips and the command palette. */
export const SHORTCUTS = {
  command: { keys: ["⌘", "K"], label: "Command menu" },
  search: { keys: ["/"], label: "Search" },
  createIssue: { keys: ["C"], label: "Create issue" },
  goOverview: { keys: ["G", "O"], label: "Go to Overview" },
  goTasks: { keys: ["G", "M"], label: "Go to My Tasks" },
  goIssues: { keys: ["G", "I"], label: "Go to Issues" },
  goPulls: { keys: ["G", "P"], label: "Go to Pull Requests" },
} as const;
