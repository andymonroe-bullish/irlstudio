-- ════════════════════════════════════════════════════════════════════════════
-- Applied live via the Supabase Management API on 2026-06-24.
-- The live schema is dashboard-managed and has drifted from older migration files
-- (e.g. profiles is keyed by `id`, not `user_id`), so this file documents exactly
-- what was applied to production rather than being run via `db push`.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Helper functions (SECURITY DEFINER so they bypass RLS cleanly) ────────────
CREATE OR REPLACE FUNCTION public.can_access_event(eid uuid)
RETURNS boolean AS $func$
  SELECT EXISTS (SELECT 1 FROM public.events e
                 WHERE e.id = eid AND e.created_by = auth.uid())
      OR EXISTS (SELECT 1 FROM public.event_collaborators ec
                 WHERE ec.event_id = eid AND ec.user_id = auth.uid());
$func$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_edit_event(eid uuid)
RETURNS boolean AS $func$
  SELECT EXISTS (SELECT 1 FROM public.events e
                 WHERE e.id = eid AND e.created_by = auth.uid())
      OR EXISTS (SELECT 1 FROM public.event_collaborators ec
                 WHERE ec.event_id = eid AND ec.user_id = auth.uid()
                       AND ec.role <> 'viewer');
$func$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ── task_assignees join table (was never created in prod -> assignment never
--    persisted). Multiple assignees per task. ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, user_id)
);
CREATE INDEX IF NOT EXISTS task_assignees_task_id_idx ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS task_assignees_user_id_idx ON public.task_assignees(user_id);
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View task assignees" ON public.task_assignees;
CREATE POLICY "View task assignees" ON public.task_assignees FOR SELECT
USING (public.can_access_event((SELECT event_id FROM public.tasks WHERE id = task_assignees.task_id)));

DROP POLICY IF EXISTS "Add task assignees" ON public.task_assignees;
CREATE POLICY "Add task assignees" ON public.task_assignees FOR INSERT
WITH CHECK (public.can_edit_event((SELECT event_id FROM public.tasks WHERE id = task_assignees.task_id)));

DROP POLICY IF EXISTS "Remove task assignees" ON public.task_assignees;
CREATE POLICY "Remove task assignees" ON public.task_assignees FOR DELETE
USING (public.can_edit_event((SELECT event_id FROM public.tasks WHERE id = task_assignees.task_id)));

-- ── Fix: event_files had no UPDATE policy, so file renames silently affected
--    0 rows (no error) and reverted on refresh. ─────────────────────────────────
DROP POLICY IF EXISTS "event_files_update" ON public.event_files;
CREATE POLICY "event_files_update" ON public.event_files FOR UPDATE
USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
