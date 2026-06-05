-- Allow invited users to see their own invitations (by matching their email)
CREATE POLICY "Invited users can view their invitations"
ON public.event_invitations
FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow invited users to update their own invitations (to accept them)
CREATE POLICY "Invited users can accept their invitations"
ON public.event_invitations
FOR UPDATE
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow invited users to add themselves as collaborators when accepting invitations
CREATE POLICY "Invited users can add themselves as collaborators"
ON public.event_collaborators
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM event_invitations
    WHERE event_invitations.event_id = event_collaborators.event_id
    AND event_invitations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND event_invitations.status = 'pending'
  )
);