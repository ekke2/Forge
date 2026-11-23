-- Forge — initial schema
--
-- Architectural rule (see Instructions §21, §25): GitHub is the source of truth
-- for GitHub-owned objects (issues, pull requests, commits, reviews). The
-- `*_cache` tables below are a read-through mirror maintained ONLY by the
-- server-side sync engine using the service-role key. They deliberately have no
-- INSERT/UPDATE/DELETE RLS policies for end users — the browser can read cached
-- data but can never write it directly.
--
-- Forge-owned objects (app_tasks, issue_workflow, messages) are true
-- application data and are writable by project members under RLS.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type member_role       as enum ('owner', 'admin', 'member', 'viewer');
create type project_plan      as enum ('free', 'team');
create type sync_state        as enum ('idle', 'syncing', 'error');
create type sync_run_status   as enum ('running', 'success', 'error');
create type sync_trigger      as enum ('initial', 'manual', 'scheduled');
create type workflow_status   as enum ('todo', 'in_progress', 'in_review', 'done');
create type task_priority     as enum ('none', 'low', 'medium', 'high', 'urgent');
create type issue_state       as enum ('open', 'closed');
create type pr_state          as enum ('open', 'closed', 'merged');
create type activity_source   as enum ('github', 'forge');

-- ---------------------------------------------------------------------------
-- Utility: updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text,
  display_name   text,
  github_username text,
  github_user_id bigint,
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Provision a profile whenever a new auth user is created, pulling whatever
-- GitHub OAuth handed us out of the identity metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, github_username, github_user_id, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'user_name',
      new.raw_user_meta_data ->> 'preferred_username'
    ),
    nullif(new.raw_user_meta_data ->> 'provider_id', '')::bigint,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email          = excluded.email,
    display_name   = coalesce(public.profiles.display_name, excluded.display_name),
    github_username = coalesce(excluded.github_username, public.profiles.github_username),
    github_user_id  = coalesce(excluded.github_user_id, public.profiles.github_user_id),
    avatar_url      = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profile e-mail / avatar in step when the identity is refreshed.
create trigger on_auth_user_updated
  after update of raw_user_meta_data, email on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null,
  owner_id        uuid not null references public.profiles (id) on delete cascade,
  description     text,
  repo_owner      text not null,
  repo_name       text not null,
  repo_full_name  text not null,
  repo_github_id  bigint,
  repo_url        text,
  default_branch  text not null default 'main',
  is_private      boolean not null default false,
  plan            project_plan not null default 'free',
  plan_seats      integer not null default 1,
  github_mode     text not null default 'mock',   -- 'mock' | 'live'
  last_synced_at  timestamptz,
  sync_status     sync_state not null default 'idle',
  sync_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (owner_id, slug)
);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project_members
-- ---------------------------------------------------------------------------
create table public.project_members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index project_members_user_idx on public.project_members (user_id);

-- The project creator automatically becomes its owner. Doing this in a trigger
-- avoids a chicken-and-egg with the membership RLS policies.
create or replace function public.handle_new_project()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- ---------------------------------------------------------------------------
-- Access-control helpers (security definer; bypass RLS intentionally)
-- ---------------------------------------------------------------------------
create or replace function public.is_project_member(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = pid and m.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_project(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = pid and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

create or replace function public.shares_project_with(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.project_members a
    join public.project_members b on a.project_id = b.project_id
    where a.user_id = auth.uid() and b.user_id = target
  );
$$;

-- ---------------------------------------------------------------------------
-- sync_runs  (audit log of synchronisation passes)
-- ---------------------------------------------------------------------------
create table public.sync_runs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  trigger     sync_trigger not null default 'manual',
  status      sync_run_status not null default 'running',
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  stats       jsonb not null default '{}'::jsonb,
  error       text
);

create index sync_runs_project_idx on public.sync_runs (project_id, started_at desc);

-- ---------------------------------------------------------------------------
-- issues_cache  (GitHub-owned, mirror)
-- ---------------------------------------------------------------------------
create table public.issues_cache (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects (id) on delete cascade,
  github_id         bigint not null,
  number            integer not null,
  title             text not null,
  body              text,
  state             issue_state not null default 'open',
  state_reason      text,
  author_login      text,
  author_avatar_url text,
  assignees         jsonb not null default '[]'::jsonb,
  labels            jsonb not null default '[]'::jsonb,
  comments_count    integer not null default 0,
  milestone_title   text,
  html_url          text,
  github_created_at timestamptz,
  github_updated_at timestamptz,
  github_closed_at  timestamptz,
  synced_at         timestamptz not null default now(),
  unique (project_id, number)
);

create index issues_cache_state_idx   on public.issues_cache (project_id, state);
create index issues_cache_updated_idx on public.issues_cache (project_id, github_updated_at desc);

-- ---------------------------------------------------------------------------
-- issue_workflow  (Forge-owned metadata layered on a GitHub issue)
-- ---------------------------------------------------------------------------
create table public.issue_workflow (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  issue_number integer not null,
  status       workflow_status not null default 'todo',
  priority     task_priority not null default 'none',
  position     double precision not null default 0,
  updated_by   uuid references public.profiles (id),
  updated_at   timestamptz not null default now(),
  unique (project_id, issue_number)
);

create trigger issue_workflow_set_updated_at
  before update on public.issue_workflow
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pull_requests_cache  (GitHub-owned, mirror)
-- ---------------------------------------------------------------------------
create table public.pull_requests_cache (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  github_id           bigint not null,
  number              integer not null,
  title               text not null,
  body                text,
  state               pr_state not null default 'open',
  draft               boolean not null default false,
  author_login        text,
  author_avatar_url   text,
  base_ref            text,
  head_ref            text,
  additions           integer not null default 0,
  deletions           integer not null default 0,
  changed_files       integer not null default 0,
  commits_count       integer not null default 0,
  comments_count      integer not null default 0,
  review_decision     text,
  ci_state            text,
  requested_reviewers jsonb not null default '[]'::jsonb,
  labels              jsonb not null default '[]'::jsonb,
  linked_issue_number integer,
  html_url            text,
  github_created_at   timestamptz,
  github_updated_at   timestamptz,
  github_merged_at    timestamptz,
  synced_at           timestamptz not null default now(),
  unique (project_id, number)
);

create index prs_cache_state_idx   on public.pull_requests_cache (project_id, state);
create index prs_cache_updated_idx on public.pull_requests_cache (project_id, github_updated_at desc);

-- ---------------------------------------------------------------------------
-- pr_reviews  (GitHub-owned, mirror)
-- ---------------------------------------------------------------------------
create table public.pr_reviews (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  pr_number           integer not null,
  github_id           bigint,
  reviewer_login      text not null,
  reviewer_avatar_url text,
  state               text not null,
  body                text,
  submitted_at        timestamptz,
  synced_at           timestamptz not null default now(),
  unique (project_id, github_id)
);

create index pr_reviews_pr_idx on public.pr_reviews (project_id, pr_number);

-- ---------------------------------------------------------------------------
-- commits_cache  (GitHub-owned, mirror)
-- ---------------------------------------------------------------------------
create table public.commits_cache (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects (id) on delete cascade,
  sha               text not null,
  message           text not null,
  author_login      text,
  author_name       text,
  author_avatar_url text,
  authored_at       timestamptz,
  additions         integer,
  deletions         integer,
  html_url          text,
  synced_at         timestamptz not null default now(),
  unique (project_id, sha)
);

create index commits_cache_authored_idx on public.commits_cache (project_id, authored_at desc);

-- ---------------------------------------------------------------------------
-- app_tasks  (Forge-owned)
-- ---------------------------------------------------------------------------
create table public.app_tasks (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  title               text not null,
  description         text,
  status              workflow_status not null default 'todo',
  priority            task_priority not null default 'none',
  assignee_id         uuid references public.profiles (id) on delete set null,
  creator_id          uuid not null references public.profiles (id) on delete cascade,
  linked_issue_number integer,
  due_date            date,
  position            double precision not null default 0,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index app_tasks_project_status_idx on public.app_tasks (project_id, status);
create index app_tasks_assignee_idx       on public.app_tasks (assignee_id);

create trigger app_tasks_set_updated_at
  before update on public.app_tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- messages  (Forge-owned; channel- or issue-scoped)
-- ---------------------------------------------------------------------------
create table public.messages (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  channel      text,
  issue_number integer,
  author_id    uuid not null references public.profiles (id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now(),
  check (channel is not null or issue_number is not null)
);

create index messages_channel_idx on public.messages (project_id, channel, created_at);
create index messages_issue_idx   on public.messages (project_id, issue_number, created_at);

-- ---------------------------------------------------------------------------
-- activity  (unified GitHub + Forge feed)
-- ---------------------------------------------------------------------------
create table public.activity (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  source           activity_source not null,
  actor_login      text,
  actor_avatar_url text,
  actor_id         uuid references public.profiles (id),
  verb             text not null,
  object_type      text not null,
  object_ref       text,
  title            text,
  summary          text not null,
  url              text,
  occurred_at      timestamptz not null default now(),
  dedupe_key       text,
  unique (project_id, dedupe_key)
);

create index activity_feed_idx on public.activity (project_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- contribution_stats_cache  (derived from GitHub-owned data)
-- ---------------------------------------------------------------------------
create table public.contribution_stats_cache (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects (id) on delete cascade,
  member_login      text not null,
  member_avatar_url text,
  period            text not null default 'all',
  commits           integer not null default 0,
  prs_opened        integer not null default 0,
  prs_merged        integer not null default 0,
  issues_closed     integer not null default 0,
  reviews           integer not null default 0,
  synced_at         timestamptz not null default now(),
  unique (project_id, member_login, period)
);

-- ---------------------------------------------------------------------------
-- github_mock_overrides
--
-- Only used while `projects.github_mode = 'mock'`. Lets the mock GitHub source
-- persist objects created/updated through Forge so the "GitHub is
-- authoritative" round-trip behaves realistically across requests and syncs.
-- ---------------------------------------------------------------------------
create table public.github_mock_overrides (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind       text not null,
  number     integer not null,
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, kind, number)
);

create trigger github_mock_overrides_set_updated_at
  before update on public.github_mock_overrides
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles                 enable row level security;
alter table public.projects                 enable row level security;
alter table public.project_members          enable row level security;
alter table public.sync_runs                enable row level security;
alter table public.issues_cache             enable row level security;
alter table public.issue_workflow           enable row level security;
alter table public.pull_requests_cache      enable row level security;
alter table public.pr_reviews               enable row level security;
alter table public.commits_cache            enable row level security;
alter table public.app_tasks                enable row level security;
alter table public.messages                 enable row level security;
alter table public.activity                 enable row level security;
alter table public.contribution_stats_cache enable row level security;
alter table public.github_mock_overrides    enable row level security;

-- profiles ------------------------------------------------------------------
create policy "profiles: read self or teammates" on public.profiles
  for select using (id = auth.uid() or public.shares_project_with(id));
create policy "profiles: update self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: insert self" on public.profiles
  for insert with check (id = auth.uid());

-- projects ----------------------------------------------------------------
create policy "projects: members read" on public.projects
  for select using (public.is_project_member(id));
create policy "projects: owner creates" on public.projects
  for insert with check (owner_id = auth.uid());
create policy "projects: managers update" on public.projects
  for update using (public.can_manage_project(id)) with check (public.can_manage_project(id));
create policy "projects: owner deletes" on public.projects
  for delete using (owner_id = auth.uid());

-- project_members -------------------------------------------------------
create policy "members: project members read" on public.project_members
  for select using (public.is_project_member(project_id));
create policy "members: managers add" on public.project_members
  for insert with check (public.can_manage_project(project_id));
create policy "members: managers update" on public.project_members
  for update using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));
create policy "members: managers remove non-owner" on public.project_members
  for delete using (
    public.can_manage_project(project_id)
    and user_id <> (select owner_id from public.projects p where p.id = project_id)
  );

-- Cache tables: read-only for members; writes happen through the service role.
create policy "sync_runs: members read" on public.sync_runs
  for select using (public.is_project_member(project_id));
create policy "issues_cache: members read" on public.issues_cache
  for select using (public.is_project_member(project_id));
create policy "prs_cache: members read" on public.pull_requests_cache
  for select using (public.is_project_member(project_id));
create policy "pr_reviews: members read" on public.pr_reviews
  for select using (public.is_project_member(project_id));
create policy "commits_cache: members read" on public.commits_cache
  for select using (public.is_project_member(project_id));
create policy "activity: members read" on public.activity
  for select using (public.is_project_member(project_id));
create policy "contribution_stats: members read" on public.contribution_stats_cache
  for select using (public.is_project_member(project_id));
create policy "mock_overrides: members read" on public.github_mock_overrides
  for select using (public.is_project_member(project_id));

-- issue_workflow: Forge-owned, members collaborate -----------------------
create policy "issue_workflow: members read" on public.issue_workflow
  for select using (public.is_project_member(project_id));
create policy "issue_workflow: members write" on public.issue_workflow
  for insert with check (public.is_project_member(project_id));
create policy "issue_workflow: members update" on public.issue_workflow
  for update using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy "issue_workflow: members delete" on public.issue_workflow
  for delete using (public.is_project_member(project_id));

-- app_tasks: Forge-owned ----------------------------------------------------
create policy "app_tasks: members read" on public.app_tasks
  for select using (public.is_project_member(project_id));
create policy "app_tasks: members create" on public.app_tasks
  for insert with check (public.is_project_member(project_id) and creator_id = auth.uid());
create policy "app_tasks: members update" on public.app_tasks
  for update using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy "app_tasks: creator or manager deletes" on public.app_tasks
  for delete using (public.is_project_member(project_id) and (creator_id = auth.uid() or public.can_manage_project(project_id)));

-- messages: Forge-owned ---------------------------------------------------
create policy "messages: members read" on public.messages
  for select using (public.is_project_member(project_id));
create policy "messages: members post" on public.messages
  for insert with check (public.is_project_member(project_id) and author_id = auth.uid());
create policy "messages: author or manager deletes" on public.messages
  for delete using (author_id = auth.uid() or public.can_manage_project(project_id));

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.activity;
