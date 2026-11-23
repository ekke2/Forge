-- The project creator's membership row is written by an AFTER INSERT trigger
-- (handle_new_project). When `insert ... returning` re-checks the SELECT policy
-- for the RETURNING row in the same statement, the STABLE is_project_member()
-- helper may not yet see that trigger-inserted membership, so the insert appears
-- to "violate row-level security policy for table projects".
--
-- Letting the owner read their own project directly removes the race without
-- weakening isolation (a project's owner_id is always the creator).
drop policy if exists "projects: members read" on public.projects;
create policy "projects: members read" on public.projects
  for select using (owner_id = auth.uid() or public.is_project_member(id));
