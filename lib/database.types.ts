export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity: {
        Row: {
          actor_avatar_url: string | null
          actor_id: string | null
          actor_login: string | null
          dedupe_key: string | null
          id: string
          object_ref: string | null
          object_type: string
          occurred_at: string
          project_id: string
          source: Database["public"]["Enums"]["activity_source"]
          summary: string
          title: string | null
          url: string | null
          verb: string
        }
        Insert: {
          actor_avatar_url?: string | null
          actor_id?: string | null
          actor_login?: string | null
          dedupe_key?: string | null
          id?: string
          object_ref?: string | null
          object_type: string
          occurred_at?: string
          project_id: string
          source: Database["public"]["Enums"]["activity_source"]
          summary: string
          title?: string | null
          url?: string | null
          verb: string
        }
        Update: {
          actor_avatar_url?: string | null
          actor_id?: string | null
          actor_login?: string | null
          dedupe_key?: string | null
          id?: string
          object_ref?: string | null
          object_type?: string
          occurred_at?: string
          project_id?: string
          source?: Database["public"]["Enums"]["activity_source"]
          summary?: string
          title?: string | null
          url?: string | null
          verb?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      app_tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          creator_id: string
          description: string | null
          due_date: string | null
          id: string
          linked_issue_number: number | null
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status: Database["public"]["Enums"]["workflow_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          linked_issue_number?: number | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status?: Database["public"]["Enums"]["workflow_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          linked_issue_number?: number | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          status?: Database["public"]["Enums"]["workflow_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_tasks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      commits_cache: {
        Row: {
          additions: number | null
          author_avatar_url: string | null
          author_login: string | null
          author_name: string | null
          authored_at: string | null
          deletions: number | null
          html_url: string | null
          id: string
          message: string
          project_id: string
          sha: string
          synced_at: string
        }
        Insert: {
          additions?: number | null
          author_avatar_url?: string | null
          author_login?: string | null
          author_name?: string | null
          authored_at?: string | null
          deletions?: number | null
          html_url?: string | null
          id?: string
          message: string
          project_id: string
          sha: string
          synced_at?: string
        }
        Update: {
          additions?: number | null
          author_avatar_url?: string | null
          author_login?: string | null
          author_name?: string | null
          authored_at?: string | null
          deletions?: number | null
          html_url?: string | null
          id?: string
          message?: string
          project_id?: string
          sha?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commits_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_stats_cache: {
        Row: {
          commits: number
          id: string
          issues_closed: number
          member_avatar_url: string | null
          member_login: string
          period: string
          project_id: string
          prs_merged: number
          prs_opened: number
          reviews: number
          synced_at: string
        }
        Insert: {
          commits?: number
          id?: string
          issues_closed?: number
          member_avatar_url?: string | null
          member_login: string
          period?: string
          project_id: string
          prs_merged?: number
          prs_opened?: number
          reviews?: number
          synced_at?: string
        }
        Update: {
          commits?: number
          id?: string
          issues_closed?: number
          member_avatar_url?: string | null
          member_login?: string
          period?: string
          project_id?: string
          prs_merged?: number
          prs_opened?: number
          reviews?: number
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_stats_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      github_mock_overrides: {
        Row: {
          created_at: string
          id: string
          kind: string
          number: number
          payload: Json
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          number: number
          payload: Json
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          number?: number
          payload?: Json
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_mock_overrides_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_workflow: {
        Row: {
          id: string
          issue_number: number
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status: Database["public"]["Enums"]["workflow_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          issue_number: number
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          issue_number?: number
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_workflow_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_workflow_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issues_cache: {
        Row: {
          assignees: Json
          author_avatar_url: string | null
          author_login: string | null
          body: string | null
          comments_count: number
          github_closed_at: string | null
          github_created_at: string | null
          github_id: number
          github_updated_at: string | null
          html_url: string | null
          id: string
          labels: Json
          milestone_title: string | null
          number: number
          project_id: string
          state: Database["public"]["Enums"]["issue_state"]
          state_reason: string | null
          synced_at: string
          title: string
        }
        Insert: {
          assignees?: Json
          author_avatar_url?: string | null
          author_login?: string | null
          body?: string | null
          comments_count?: number
          github_closed_at?: string | null
          github_created_at?: string | null
          github_id: number
          github_updated_at?: string | null
          html_url?: string | null
          id?: string
          labels?: Json
          milestone_title?: string | null
          number: number
          project_id: string
          state?: Database["public"]["Enums"]["issue_state"]
          state_reason?: string | null
          synced_at?: string
          title: string
        }
        Update: {
          assignees?: Json
          author_avatar_url?: string | null
          author_login?: string | null
          body?: string | null
          comments_count?: number
          github_closed_at?: string | null
          github_created_at?: string | null
          github_id?: number
          github_updated_at?: string | null
          html_url?: string | null
          id?: string
          labels?: Json
          milestone_title?: string | null
          number?: number
          project_id?: string
          state?: Database["public"]["Enums"]["issue_state"]
          state_reason?: string | null
          synced_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string
          body: string
          channel: string | null
          created_at: string
          id: string
          issue_number: number | null
          project_id: string
        }
        Insert: {
          author_id: string
          body: string
          channel?: string | null
          created_at?: string
          id?: string
          issue_number?: number | null
          project_id: string
        }
        Update: {
          author_id?: string
          body?: string
          channel?: string | null
          created_at?: string
          id?: string
          issue_number?: number | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pr_reviews: {
        Row: {
          body: string | null
          github_id: number | null
          id: string
          pr_number: number
          project_id: string
          reviewer_avatar_url: string | null
          reviewer_login: string
          state: string
          submitted_at: string | null
          synced_at: string
        }
        Insert: {
          body?: string | null
          github_id?: number | null
          id?: string
          pr_number: number
          project_id: string
          reviewer_avatar_url?: string | null
          reviewer_login: string
          state: string
          submitted_at?: string | null
          synced_at?: string
        }
        Update: {
          body?: string | null
          github_id?: number | null
          id?: string
          pr_number?: number
          project_id?: string
          reviewer_avatar_url?: string | null
          reviewer_login?: string
          state?: string
          submitted_at?: string | null
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pr_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          github_user_id: number | null
          github_username: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          github_user_id?: number | null
          github_username?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          github_user_id?: number | null
          github_username?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          default_branch: string
          description: string | null
          github_mode: string
          id: string
          is_private: boolean
          last_synced_at: string | null
          name: string
          owner_id: string
          plan: Database["public"]["Enums"]["project_plan"]
          plan_seats: number
          repo_full_name: string
          repo_github_id: number | null
          repo_name: string
          repo_owner: string
          repo_url: string | null
          slug: string
          sync_error: string | null
          sync_status: Database["public"]["Enums"]["sync_state"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_branch?: string
          description?: string | null
          github_mode?: string
          id?: string
          is_private?: boolean
          last_synced_at?: string | null
          name: string
          owner_id: string
          plan?: Database["public"]["Enums"]["project_plan"]
          plan_seats?: number
          repo_full_name: string
          repo_github_id?: number | null
          repo_name: string
          repo_owner: string
          repo_url?: string | null
          slug: string
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_state"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_branch?: string
          description?: string | null
          github_mode?: string
          id?: string
          is_private?: boolean
          last_synced_at?: string | null
          name?: string
          owner_id?: string
          plan?: Database["public"]["Enums"]["project_plan"]
          plan_seats?: number
          repo_full_name?: string
          repo_github_id?: number | null
          repo_name?: string
          repo_owner?: string
          repo_url?: string | null
          slug?: string
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pull_requests_cache: {
        Row: {
          additions: number
          author_avatar_url: string | null
          author_login: string | null
          base_ref: string | null
          body: string | null
          changed_files: number
          ci_state: string | null
          comments_count: number
          commits_count: number
          deletions: number
          draft: boolean
          github_created_at: string | null
          github_id: number
          github_merged_at: string | null
          github_updated_at: string | null
          head_ref: string | null
          html_url: string | null
          id: string
          labels: Json
          linked_issue_number: number | null
          number: number
          project_id: string
          requested_reviewers: Json
          review_decision: string | null
          state: Database["public"]["Enums"]["pr_state"]
          synced_at: string
          title: string
        }
        Insert: {
          additions?: number
          author_avatar_url?: string | null
          author_login?: string | null
          base_ref?: string | null
          body?: string | null
          changed_files?: number
          ci_state?: string | null
          comments_count?: number
          commits_count?: number
          deletions?: number
          draft?: boolean
          github_created_at?: string | null
          github_id: number
          github_merged_at?: string | null
          github_updated_at?: string | null
          head_ref?: string | null
          html_url?: string | null
          id?: string
          labels?: Json
          linked_issue_number?: number | null
          number: number
          project_id: string
          requested_reviewers?: Json
          review_decision?: string | null
          state?: Database["public"]["Enums"]["pr_state"]
          synced_at?: string
          title: string
        }
        Update: {
          additions?: number
          author_avatar_url?: string | null
          author_login?: string | null
          base_ref?: string | null
          body?: string | null
          changed_files?: number
          ci_state?: string | null
          comments_count?: number
          commits_count?: number
          deletions?: number
          draft?: boolean
          github_created_at?: string | null
          github_id?: number
          github_merged_at?: string | null
          github_updated_at?: string | null
          head_ref?: string | null
          html_url?: string | null
          id?: string
          labels?: Json
          linked_issue_number?: number | null
          number?: number
          project_id?: string
          requested_reviewers?: Json
          review_decision?: string | null
          state?: Database["public"]["Enums"]["pr_state"]
          synced_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pull_requests_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: string
          project_id: string
          started_at: string
          stats: Json
          status: Database["public"]["Enums"]["sync_run_status"]
          trigger: Database["public"]["Enums"]["sync_trigger"]
        }
        Insert: {
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          project_id: string
          started_at?: string
          stats?: Json
          status?: Database["public"]["Enums"]["sync_run_status"]
          trigger?: Database["public"]["Enums"]["sync_trigger"]
        }
        Update: {
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          project_id?: string
          started_at?: string
          stats?: Json
          status?: Database["public"]["Enums"]["sync_run_status"]
          trigger?: Database["public"]["Enums"]["sync_trigger"]
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_project: { Args: { pid: string }; Returns: boolean }
      is_project_member: { Args: { pid: string }; Returns: boolean }
      shares_project_with: { Args: { target: string }; Returns: boolean }
    }
    Enums: {
      activity_source: "github" | "forge"
      issue_state: "open" | "closed"
      member_role: "owner" | "admin" | "member" | "viewer"
      pr_state: "open" | "closed" | "merged"
      project_plan: "free" | "team"
      sync_run_status: "running" | "success" | "error"
      sync_state: "idle" | "syncing" | "error"
      sync_trigger: "initial" | "manual" | "scheduled"
      task_priority: "none" | "low" | "medium" | "high" | "urgent"
      workflow_status: "todo" | "in_progress" | "in_review" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_source: ["github", "forge"],
      issue_state: ["open", "closed"],
      member_role: ["owner", "admin", "member", "viewer"],
      pr_state: ["open", "closed", "merged"],
      project_plan: ["free", "team"],
      sync_run_status: ["running", "success", "error"],
      sync_state: ["idle", "syncing", "error"],
      sync_trigger: ["initial", "manual", "scheduled"],
      task_priority: ["none", "low", "medium", "high", "urgent"],
      workflow_status: ["todo", "in_progress", "in_review", "done"],
    },
  },
} as const

