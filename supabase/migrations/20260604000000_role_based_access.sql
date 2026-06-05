-- Add role column to event_invitations so the role is preserved through the invite flow
ALTER TABLE public.event_invitations
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'editor';

-- Prevent duplicate invitations for the same email+event combination
ALTER TABLE public.event_invitations
ADD CONSTRAINT unique_invitation_per_event_email UNIQUE (event_id, email);

-- Allow event owners to update collaborator roles
CREATE POLICY "Event owners can update collaborator roles"
ON public.event_collaborators FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.events WHERE id = event_collaborators.event_id AND user_id = auth.uid()
));

-- Role-aware write policies: viewers (clients) get read-only access
-- Editors and owners retain full write access

-- Events: only non-viewer collaborators can update
DROP POLICY IF EXISTS "Collaborators can update shared events" ON public.events;
CREATE POLICY "Collaborators can update shared events"
ON public.events FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.event_collaborators
  WHERE event_id = events.id AND user_id = auth.uid() AND role != 'viewer'
));

-- Tasks
DROP POLICY IF EXISTS "Collaborators can create tasks" ON public.tasks;
CREATE POLICY "Collaborators can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.event_collaborators
  WHERE event_id = tasks.event_id AND user_id = auth.uid() AND role != 'viewer'
));

DROP POLICY IF EXISTS "Collaborators can update tasks" ON public.tasks;
CREATE POLICY "Collaborators can update tasks"
ON public.tasks FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.event_collaborators
  WHERE event_id = tasks.event_id AND user_id = auth.uid() AND role != 'viewer'
));

DROP POLICY IF EXISTS "Collaborators can delete tasks" ON public.tasks;
CREATE POLICY "Collaborators can delete tasks"
ON public.tasks FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.event_collaborators
  WHERE event_id = tasks.event_id AND user_id = auth.uid() AND role != 'viewer'
));

-- Budget items
DROP POLICY IF EXISTS "Collaborators can create budget_items" ON public.budget_items;
CREATE POLICY "Collaborators can create budget_items"
ON public.budget_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.event_collaborators
  WHERE event_id = budget_items.event_id AND user_id = auth.uid() AND role != 'viewer'
));

DROP POLICY IF EXISTS "Collaborators can update budget_items" ON public.budget_items;
CREATE POLICY "Collaborators can update budget_items"
ON public.budget_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.event_collaborators
  WHERE event_id = budget_items.event_id AND user_id = auth.uid() AND role != 'viewer'
));

DROP POLICY IF EXISTS "Collaborators can delete budget_items" ON public.budget_items;
CREATE POLICY "Collaborators can delete budget_items"
ON public.budget_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.event_collaborators
  WHERE event_id = budget_items.event_id AND user_id = auth.uid() AND role != 'viewer'
));

-- Revenue streams
DROP POLICY IF EXISTS "Collaborators can create revenue_streams" ON public.revenue_streams;
CREATE POLICY "Collaborators can create revenue_streams"
ON public.revenue_streams FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.event_collaborators
  WHERE event_id = revenue_streams.event_id AND user_id = auth.uid() AND role != 'viewer'
));

DROP POLICY IF EXISTS "Collaborators can update revenue_streams" ON public.revenue_streams;
CREATE POLICY "Collaborators can update revenue_streams"
ON public.revenue_streams FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.event_collaborators
  WHERE event_id = revenue_streams.event_id AND user_id = auth.uid() AND role != 'viewer'
));

DROP POLICY IF EXISTS "Collaborators can delete revenue_streams" ON public.revenue_streams;
CREATE POLICY "Collaborators can delete revenue_streams"
ON public.revenue_streams FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.event_collaborators
  WHERE event_id = revenue_streams.event_id AND user_id = auth.uid() AND role != 'viewer'
));

-- Sub tasks
DROP POLICY IF EXISTS "Collaborators can create sub_tasks" ON public.sub_tasks;
CREATE POLICY "Collaborators can create sub_tasks"
ON public.sub_tasks FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tasks t
  JOIN public.event_collaborators ec ON t.event_id = ec.event_id
  WHERE t.id = sub_tasks.task_id AND ec.user_id = auth.uid() AND ec.role != 'viewer'
));

DROP POLICY IF EXISTS "Collaborators can update sub_tasks" ON public.sub_tasks;
CREATE POLICY "Collaborators can update sub_tasks"
ON public.sub_tasks FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.tasks t
  JOIN public.event_collaborators ec ON t.event_id = ec.event_id
  WHERE t.id = sub_tasks.task_id AND ec.user_id = auth.uid() AND ec.role != 'viewer'
));

DROP POLICY IF EXISTS "Collaborators can delete sub_tasks" ON public.sub_tasks;
CREATE POLICY "Collaborators can delete sub_tasks"
ON public.sub_tasks FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.tasks t
  JOIN public.event_collaborators ec ON t.event_id = ec.event_id
  WHERE t.id = sub_tasks.task_id AND ec.user_id = auth.uid() AND ec.role != 'viewer'
));

-- Task files
DROP POLICY IF EXISTS "Collaborators can create task_files" ON public.task_files;
CREATE POLICY "Collaborators can create task_files"
ON public.task_files FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tasks t
  JOIN public.event_collaborators ec ON t.event_id = ec.event_id
  WHERE t.id = task_files.task_id AND ec.user_id = auth.uid() AND ec.role != 'viewer'
));

DROP POLICY IF EXISTS "Collaborators can delete task_files" ON public.task_files;
CREATE POLICY "Collaborators can delete task_files"
ON public.task_files FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.tasks t
  JOIN public.event_collaborators ec ON t.event_id = ec.event_id
  WHERE t.id = task_files.task_id AND ec.user_id = auth.uid() AND ec.role != 'viewer'
));

-- Task links
DROP POLICY IF EXISTS "Collaborators can create task_links" ON public.task_links;
CREATE POLICY "Collaborators can create task_links"
ON public.task_links FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tasks t
  JOIN public.event_collaborators ec ON t.event_id = ec.event_id
  WHERE t.id = task_links.task_id AND ec.user_id = auth.uid() AND ec.role != 'viewer'
));

DROP POLICY IF EXISTS "Collaborators can delete task_links" ON public.task_links;
CREATE POLICY "Collaborators can delete task_links"
ON public.task_links FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.tasks t
  JOIN public.event_collaborators ec ON t.event_id = ec.event_id
  WHERE t.id = task_links.task_id AND ec.user_id = auth.uid() AND ec.role != 'viewer'
));

-- Task comments
DROP POLICY IF EXISTS "Collaborators can create task_comments" ON public.task_comments;
CREATE POLICY "Collaborators can create task_comments"
ON public.task_comments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tasks t
  JOIN public.event_collaborators ec ON t.event_id = ec.event_id
  WHERE t.id = task_comments.task_id AND ec.user_id = auth.uid() AND ec.role != 'viewer'
));

-- Update the invited-user self-add policy to carry the role from the invitation
DROP POLICY IF EXISTS "Invited users can add themselves as collaborators" ON public.event_collaborators;
CREATE POLICY "Invited users can add themselves as collaborators"
ON public.event_collaborators FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.event_invitations
    WHERE event_invitations.event_id = event_collaborators.event_id
    AND lower(event_invitations.email) = lower(auth.jwt() ->> 'email')
    AND event_invitations.status = 'pending'
    AND event_invitations.role = event_collaborators.role
  )
);
