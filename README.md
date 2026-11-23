# Forge

**GitHub-native project management.** Forge brings issues, pull requests,
commits and team workflow into one calm, keyboard-first workspace — so
project management lives where the code already does.

> Your team's project management should live where your code already lives.

GitHub stays the source of truth. Forge adds the layer GitHub doesn't provide:
a Kanban workflow, a personal task queue, team messaging, contribution
context and a unified activity feed — all synced through a server-side engine
with full Row-Level Security isolation per project.

## Features

- **Overview** — work summary, unified GitHub + Forge activity feed, open
  pull requests, team workload, all backed by cached, RLS-scoped queries.
- **Issues** — list and Kanban board views, issue detail with linked
  commits/PRs, and creation that writes to GitHub first and mirrors the
  result locally (GitHub is never treated as optimistic).
- **My Tasks** — one personal queue combining GitHub issues assigned to you
  and lightweight Forge-native tasks, grouped into Today / Up next / Waiting.
- **Pull requests** — list prioritised by what's waiting on your review, plus
  a detail view with a file-tree diff viewer and review status.
- **Members & workload** — contribution context (commits, PRs, reviews)
  labelled as context, not a performance score.
- **Team messaging** — channel and issue-scoped chat over Supabase Realtime.
- **Command palette** (`⌘K` / `Ctrl K`) and keyboard navigation (`g o`, `g i`,
  `g p`, `c` to create) throughout.
- **Simulated billing gate** — Free (one member) vs. Team (unlimited members,
  messaging, analytics), demonstrating a full paygate flow without a real
  payment processor.

## Architecture

- **GitHub is authoritative.** Issues, pull requests, commits and reviews are
  mirrored into `*_cache` tables that only a server-side sync engine writes,
  using the Supabase service role. There is no write policy granting the
  browser access to those tables — it is structurally impossible for the
  client to fake GitHub state.
- **Forge-owned data** — tasks, workflow status, messages — is real
  application data, readable and writable by project members under
  PostgreSQL Row-Level Security.
- **Every write to GitHub** follows one path: user action → server action →
  GitHub API → on success, update the cache → update the UI. Nothing is
  written optimistically against GitHub.
- **A provider-agnostic GitHub source** (`lib/github/source.ts`) lets the app
  run entirely offline against a deterministic seeded dataset, or against the
  real GitHub API via Octokit, with no other code change.
- **Project isolation** is enforced in the database, not the application
  layer — every project-scoped table carries an RLS policy keyed on
  membership, so a compromised client can't reach another project's data by
  changing an id.

## Tech stack

[Next.js 16](https://nextjs.org) (App Router, Server Actions) · [Supabase](https://supabase.com)
(Postgres, Auth, Row-Level Security, Realtime) · [Tailwind CSS](https://tailwindcss.com) +
[shadcn/ui](https://ui.shadcn.com) on a custom design system · [dnd-kit](https://dndkit.com) ·
TypeScript throughout.

## Getting started

```bash
npm install
npm run dev
```

You'll need a Supabase project and a `.env.local` with its URL and keys —
see `.env.example` for the variables required. By default the app runs
against a deterministic mock GitHub dataset (`GITHUB_MODE=mock`), so no
GitHub App or OAuth credentials are required to try it out.

## License

Portfolio project — provided as-is, no license granted for reuse.
