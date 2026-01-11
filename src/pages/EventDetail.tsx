import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";
import EventDashboardPersisted from "@/components/Dashboard/EventDashboardPersisted";

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;

      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Events</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
        
        <EventDashboardPersisted event={event} />
      </div>
    </div>
  );
};

export default EventDetail;