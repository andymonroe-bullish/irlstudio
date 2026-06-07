import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Silently auto-accepts any pending invitations when the user is on the dashboard.
// Events will appear automatically — no manual "Accept" click required.
export const PendingInvitationsBanner = ({ onAccepted }: { onAccepted?: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const autoAccept = async () => {
      if (!user?.email) return;

      try {
        // Find pending invitations for this user's email
        const { data: invitations, error } = await supabase
          .from("event_invitations")
          .select("id, event_id, role, event:events(name, type)")
          .eq("email", user.email.toLowerCase())
          .eq("status", "pending");

        if (error || !invitations || invitations.length === 0) return;

        for (const inv of invitations) {
          // Add to event_collaborators if not already there
          const { data: existing } = await supabase
            .from("event_collaborators")
            .select("id")
            .eq("event_id", inv.event_id)
            .eq("user_id", user.id)
            .single();

          if (!existing) {
            await supabase.from("event_collaborators").insert({
              event_id: inv.event_id,
              user_id: user.id,
              role: (inv as any).role || "editor",
            });
          }

          // Mark as accepted
          await supabase
            .from("event_invitations")
            .update({ status: "accepted" })
            .eq("id", inv.id);
        }

        const eventNames = invitations
          .map((inv: any) => inv.event?.name || "an event")
          .join(", ");

        toast({
          title: `${invitations.length === 1 ? "Event" : "Events"} shared with you`,
          description: `You now have access to: ${eventNames}`,
        });

        onAccepted?.();
      } catch (err) {
        console.error("Error auto-accepting invitations:", err);
      }
    };

    autoAccept();
  }, [user?.email]);

  return null; // No UI — events just appear automatically
};
