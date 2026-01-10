import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Event } from "./useEvents";

export interface Invitation {
  id: string;
  email: string;
  event_id: string;
  invited_by: string;
  status: string;
  created_at: string;
  token: string;
  expires_at: string;
  event?: Event;
}

export const useInvitations = () => {
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Process pending invitations for the current user
  const processPendingInvitations = useCallback(async () => {
    if (!user?.email) return;

    try {
      // Find pending invitations for this user's email
      const { data: invitations, error: fetchError } = await supabase
        .from("event_invitations")
        .select("*")
        .eq("email", user.email.toLowerCase())
        .eq("status", "pending");

      if (fetchError) throw fetchError;

      if (invitations && invitations.length > 0) {
        // Add user as collaborator for each pending invitation
        for (const invitation of invitations) {
          // Check if already a collaborator
          const { data: existing } = await supabase
            .from("event_collaborators")
            .select("id")
            .eq("event_id", invitation.event_id)
            .eq("user_id", user.id)
            .single();

          if (!existing) {
            // Add as collaborator
            await supabase.from("event_collaborators").insert({
              event_id: invitation.event_id,
              user_id: user.id,
            });
          }

          // Mark invitation as accepted
          await supabase
            .from("event_invitations")
            .update({ status: "accepted" })
            .eq("id", invitation.id);
        }

        toast({
          title: "Welcome!",
          description: `You now have access to ${invitations.length} event${invitations.length > 1 ? "s" : ""} you were invited to.`,
        });
      }
    } catch (error: unknown) {
      console.error("Error processing invitations:", error);
    }
  }, [user, toast]);

  // Run on mount when user is logged in
  useEffect(() => {
    processPendingInvitations();
  }, [processPendingInvitations]);

  const inviteToEvents = async (email: string, eventIds: string[]) => {
    if (!user) return false;

    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user is inviting themselves
      if (normalizedEmail === user.email?.toLowerCase()) {
        toast({
          title: "Cannot invite yourself",
          description: "You already have access to your own events.",
          variant: "destructive",
        });
        return false;
      }

      const invitationsToCreate = eventIds.map((eventId) => ({
        event_id: eventId,
        email: normalizedEmail,
        invited_by: user.id,
      }));

      // Create invitations
      const { error: inviteError } = await supabase
        .from("event_invitations")
        .insert(invitationsToCreate);

      if (inviteError) {
        // Check for duplicate
        if (inviteError.code === "23505") {
          toast({
            title: "Already invited",
            description: "This email has already been invited to one or more of these events.",
            variant: "destructive",
          });
          return false;
        }
        throw inviteError;
      }

      toast({
        title: "Invitation created!",
        description: `When ${normalizedEmail} signs up, they'll automatically have access to the selected event${eventIds.length > 1 ? "s" : ""}.`,
      });

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error sending invitation",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const fetchPendingInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("event_invitations")
        .select(`
          *,
          event:events (*)
        `)
        .eq("invited_by", user.id)
        .eq("status", "pending");

      if (error) throw error;

      const mappedData = (data || []).map(item => ({
        id: item.id,
        email: item.email,
        event_id: item.event_id,
        invited_by: item.invited_by,
        status: item.status,
        created_at: item.created_at,
        token: item.token,
        expires_at: item.expires_at,
        event: item.event as Event | undefined
      }));

      setPendingInvitations(mappedData);
    } catch (error: unknown) {
      console.error("Error fetching invitations:", error);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("event_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));

      toast({
        title: "Invitation cancelled",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error cancelling invitation",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return {
    pendingInvitations,
    inviteToEvents,
    fetchPendingInvitations,
    cancelInvitation,
    processPendingInvitations,
  };
};
