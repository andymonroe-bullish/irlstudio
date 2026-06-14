-- ════════════════════════════════════════════════════════════════════════════
-- Task assignment: real, multi-assignee task assignment based on event members
-- ════════════════════════════════════════════════════════════════════════════
-- Apply this in the Supabase SQL Editor (the live schema is dashboard-managed and
-- has drifted from older migration files, so `db push` is not reliable here).

-- ── 1. Helper functions (SECURITY DEFINER so they bypass RLS cleanly) ──────────
-- The events table's owner column is `created_by`.

-- Can the current user READ this event (owner or any collaborator)?
CREATE OR REPLACE FUNCTION public.can_access_event(eid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.events e
                 WHERE e.id = eid AND e.created_by = auth.uid())
      OR EXISTS (SELECT 1 FROM public.event_collaborators ec
                 WHERE ec.event_id = eid AND ec.user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Can the current user EDIT this event (owner or non-viewer collaborator)?
CREATE OR REPLACE FUNCTION public.can_edit_event(eid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.events e
                 WHERE e.id = eid AND e.created_by = auth.uid())
      OR EXISTS (SELECT 1 FROM public.event_collaborators ec
                 WHERE ec.event_id = eid AND ec.user_id = auth.uid()
                       AND ec.role <> 'viewer');
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Does the current user share at least one event with `target_user`?
-- Used so collaborators can read each other's profiles (names/avatars).
CREATE OR REPLACE FUNCTION public.shares_event_with_me(target_user uuid)
RETURNS boolean AS $$
  WITH my_events AS (
    SELECT e.id AS event_id FROM public.events e WHERE e.created_by = auth.uid()
    UNION
    SELECT ec.event_id FROM public.event_collaborators ec WHERE ec.user_id = auth.uid()
  )
  SELECT EXISTS (
    SELECT 1 FROM my_events m
    WHERE EXISTS (SELECT 1 FROM public.events e2
                  WHERE e2.id = m.event_id AND e2.created_by = target_user)
       OR EXISTS (SELECT 1 FROM public.event_collaborators ec2
                  WHERE ec2.event_id = m.event_id AND ec2.user_id = target_user)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ── 2. task_assignees join table (multiple assignees per task) ─────────────────
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
USING (public.can_access_event(
  (SELECT event_id FROM public.tasks WHERE id = task_assignees.task_id)
));

DROP POLICY IF EXISTS "Add task assignees" ON public.task_assignees;
CREATE POLICY "Add task assignees" ON public.task_assignees FOR INSERT
WITH CHECK (public.can_edit_event(
  (SELECT event_id FROM public.tasks WHERE id = task_assignees.task_id)
));

DROP POLICY IF EXISTS "Remove task assignees" ON public.task_assignees;
CREATE POLICY "Remove task assignees" ON public.task_assignees FOR DELETE
USING (public.can_edit_event(
  (SELECT event_id FROM public.tasks WHERE id = task_assignees.task_id)
));

-- ── 3. Let collaborators read each other's profiles ───────────────────────────
DROP POLICY IF EXISTS "View profiles of event co-members" ON public.profiles;
CREATE POLICY "View profiles of event co-members" ON public.profiles FOR SELECT
USING (public.shares_event_with_me(user_id));

-- ── 4. Store email on profiles so members display a name OR email fallback ─────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill existing profiles from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.user_id AND p.email IS NULL;

-- Update the signup trigger to capture full_name AND email going forward
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
