-- Create event_invitations table to track pending invitations
CREATE TABLE public.event_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Create event_collaborators table to track active collaborators
CREATE TABLE public.event_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'collaborator',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_collaborators ENABLE ROW LEVEL SECURITY;

-- Create a helper function to check if user has access to an event (owner or collaborator)
CREATE OR REPLACE FUNCTION public.user_has_event_access(event_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.events WHERE id = event_id_param AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.event_collaborators WHERE event_id = event_id_param AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Policies for event_invitations
CREATE POLICY "Event owners can view invitations"
  ON public.event_invitations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events WHERE id = event_invitations.event_id AND user_id = auth.uid()));

CREATE POLICY "Event owners can create invitations"
  ON public.event_invitations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE id = event_invitations.event_id AND user_id = auth.uid()));

CREATE POLICY "Event owners can delete invitations"
  ON public.event_invitations FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.events WHERE id = event_invitations.event_id AND user_id = auth.uid()));

-- Policies for event_collaborators
CREATE POLICY "Users can view collaborators for accessible events"
  ON public.event_collaborators FOR SELECT
  USING (public.user_has_event_access(event_id));

CREATE POLICY "Event owners can add collaborators"
  ON public.event_collaborators FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE id = event_collaborators.event_id AND user_id = auth.uid()));

CREATE POLICY "Event owners can remove collaborators"
  ON public.event_collaborators FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.events WHERE id = event_collaborators.event_id AND user_id = auth.uid()));

-- Update events RLS to include collaborators
CREATE POLICY "Collaborators can view shared events"
  ON public.events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = events.id AND user_id = auth.uid()));

CREATE POLICY "Collaborators can update shared events"
  ON public.events FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = events.id AND user_id = auth.uid()));

-- Update tasks RLS to include collaborators
CREATE POLICY "Collaborators can view tasks"
  ON public.tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = tasks.event_id AND user_id = auth.uid()));

CREATE POLICY "Collaborators can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = tasks.event_id AND user_id = auth.uid()));

CREATE POLICY "Collaborators can update tasks"
  ON public.tasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = tasks.event_id AND user_id = auth.uid()));

CREATE POLICY "Collaborators can delete tasks"
  ON public.tasks FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = tasks.event_id AND user_id = auth.uid()));

-- Update budget_items RLS to include collaborators
CREATE POLICY "Collaborators can view budget_items"
  ON public.budget_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = budget_items.event_id AND user_id = auth.uid()));

CREATE POLICY "Collaborators can create budget_items"
  ON public.budget_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = budget_items.event_id AND user_id = auth.uid()));

CREATE POLICY "Collaborators can update budget_items"
  ON public.budget_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = budget_items.event_id AND user_id = auth.uid()));

CREATE POLICY "Collaborators can delete budget_items"
  ON public.budget_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = budget_items.event_id AND user_id = auth.uid()));

-- Update revenue_streams RLS to include collaborators
CREATE POLICY "Collaborators can view revenue_streams"
  ON public.revenue_streams FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = revenue_streams.event_id AND user_id = auth.uid()));

CREATE POLICY "Collaborators can create revenue_streams"
  ON public.revenue_streams FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = revenue_streams.event_id AND user_id = auth.uid()));

CREATE POLICY "Collaborators can update revenue_streams"
  ON public.revenue_streams FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = revenue_streams.event_id AND user_id = auth.uid()));

CREATE POLICY "Collaborators can delete revenue_streams"
  ON public.revenue_streams FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = revenue_streams.event_id AND user_id = auth.uid()));

-- Update sub_tasks RLS to include collaborators
CREATE POLICY "Collaborators can view sub_tasks"
  ON public.sub_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = sub_tasks.task_id AND ec.user_id = auth.uid()
  ));

CREATE POLICY "Collaborators can create sub_tasks"
  ON public.sub_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = sub_tasks.task_id AND ec.user_id = auth.uid()
  ));

CREATE POLICY "Collaborators can update sub_tasks"
  ON public.sub_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = sub_tasks.task_id AND ec.user_id = auth.uid()
  ));

CREATE POLICY "Collaborators can delete sub_tasks"
  ON public.sub_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = sub_tasks.task_id AND ec.user_id = auth.uid()
  ));

-- Update task_files RLS to include collaborators
CREATE POLICY "Collaborators can view task_files"
  ON public.task_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = task_files.task_id AND ec.user_id = auth.uid()
  ));

CREATE POLICY "Collaborators can create task_files"
  ON public.task_files FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = task_files.task_id AND ec.user_id = auth.uid()
  ));

CREATE POLICY "Collaborators can delete task_files"
  ON public.task_files FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = task_files.task_id AND ec.user_id = auth.uid()
  ));

-- Update task_links RLS to include collaborators
CREATE POLICY "Collaborators can view task_links"
  ON public.task_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = task_links.task_id AND ec.user_id = auth.uid()
  ));

CREATE POLICY "Collaborators can create task_links"
  ON public.task_links FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = task_links.task_id AND ec.user_id = auth.uid()
  ));

CREATE POLICY "Collaborators can delete task_links"
  ON public.task_links FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = task_links.task_id AND ec.user_id = auth.uid()
  ));

-- Update task_comments RLS to include collaborators
CREATE POLICY "Collaborators can view task_comments"
  ON public.task_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = task_comments.task_id AND ec.user_id = auth.uid()
  ));

CREATE POLICY "Collaborators can create task_comments"
  ON public.task_comments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks t 
    JOIN public.event_collaborators ec ON t.event_id = ec.event_id 
    WHERE t.id = task_comments.task_id AND ec.user_id = auth.uid()
  ));

CREATE POLICY "Collaborators can delete their own comments"
  ON public.task_comments FOR DELETE
  USING (user_id = auth.uid());