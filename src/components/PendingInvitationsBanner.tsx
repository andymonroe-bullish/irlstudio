import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PendingInvitation {
  id: string;
  event_id: string;
  email: string;
  status: string;
  created_at: string;
  event?: {
    name: string | null;
    event_type: string;
  };
}

export const PendingInvitationsBanner = ({ onAccepted }: { onAccepted?: () => void }) => {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const eventTypeLabels: Record<string, string> = {
    mastermind: "Mastermind",
    fulfillment: "Fulfillment",
    acquisition: "Acquisition",
    activation: "Activation",
    networking: "Networking",
  };

  useEffect(() => {
    const fetchInvitations = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("event_invitations")
          .select(`
            id,
            event_id,
            email,
            status,
            created_at,
            event:events (name, event_type)
          `)
          .eq("email", user.email.toLowerCase())
          .eq("status", "pending");

        if (error) throw error;

        const mapped = (data || []).map((inv) => ({
          id: inv.id,
          event_id: inv.event_id,
          email: inv.email,
          status: inv.status,
          created_at: inv.created_at,
          event: inv.event as { name: string | null; event_type: string } | undefined,
        }));

        setInvitations(mapped);
      } catch (error) {
        console.error("Error fetching invitations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [user?.email]);

  const acceptInvitation = async (invitation: PendingInvitation) => {
    if (!user) return;

    setAccepting(invitation.id);
    try {
      // Check if already a collaborator
      const { data: existing } = await supabase
        .from("event_collaborators")
        .select("id")
        .eq("event_id", invitation.event_id)
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        // Add as collaborator
        const { error: collabError } = await supabase
          .from("event_collaborators")
          .insert({
            event_id: invitation.event_id,
            user_id: user.id,
          });

        if (collabError) throw collabError;
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from("event_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      // Remove from local state
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));

      const eventName = invitation.event?.name || 
        `${eventTypeLabels[invitation.event?.event_type || ""] || "Unknown"} Event`;
      
      toast({
        title: "Invitation accepted!",
        description: `You now have access to "${eventName}"`,
      });

      onAccepted?.();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error accepting invitation",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setAccepting(null);
    }
  };

  const acceptAllInvitations = async () => {
    for (const invitation of invitations) {
      await acceptInvitation(invitation);
    }
  };

  if (loading || invitations.length === 0 || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/20 rounded-full p-2 mt-0.5">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                You have {invitations.length} pending invitation{invitations.length !== 1 ? "s" : ""}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Accept to gain access to shared events
              </p>
              
              <div className="mt-3 space-y-2">
                {invitations.map((invitation) => {
                  const eventName = invitation.event?.name || 
                    `${eventTypeLabels[invitation.event?.event_type || ""] || "Unknown"} Event`;
                  
                  return (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between gap-3 bg-background/50 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm font-medium truncate">{eventName}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5"
                        disabled={accepting === invitation.id}
                        onClick={() => acceptInvitation(invitation)}
                      >
                        {accepting === invitation.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        Accept
                      </Button>
                    </div>
                  );
                })}
              </div>

              {invitations.length > 1 && (
                <Button
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={acceptAllInvitations}
                  disabled={accepting !== null}
                >
                  <CheckCircle className="w-3 h-3" />
                  Accept All
                </Button>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
