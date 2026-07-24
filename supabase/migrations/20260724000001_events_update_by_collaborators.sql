-- Events could only be updated by their creator (or admin/staff profiles),
-- so collaborators couldn't change event details like dates. Anyone with
-- access to an event (creator or collaborator) may now update it.
DROP POLICY IF EXISTS events_update ON public.events;
CREATE POLICY events_update ON public.events
  FOR UPDATE USING (
    (auth.uid() = created_by)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin', 'staff'])
    )
    OR EXISTS (
      SELECT 1 FROM public.event_collaborators ec
      WHERE ec.event_id = events.id AND ec.user_id = auth.uid()
    )
  );
