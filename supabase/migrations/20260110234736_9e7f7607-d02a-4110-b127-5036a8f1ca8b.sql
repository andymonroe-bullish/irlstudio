-- Drop the policies that are trying to access auth.users directly
DROP POLICY IF EXISTS "Invited users can view their invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Invited users can accept their invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Invited users can add themselves as collaborators" ON public.event_collaborators;

-- Recreate policies using auth.jwt() instead of querying auth.users
-- This gets the email directly from the JWT token which is accessible

-- Allow invited users to see their own invitations
CREATE POLICY "Invited users can view their invitations"
ON public.event_invitations
FOR SELECT
USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- Allow invited users to update their own invitations (to accept them)
CREATE POLICY "Invited users can accept their invitations"
ON public.event_invitations
FOR UPDATE
USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- Allow invited users to add themselves as collaborators when accepting invitations
CREATE POLICY "Invited users can add themselves as collaborators"
ON public.event_collaborators
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM event_invitations
    WHERE event_invitations.event_id = event_collaborators.event_id
    AND lower(event_invitations.email) = lower(auth.jwt() ->> 'email')
    AND event_invitations.status = 'pending'
  )
);