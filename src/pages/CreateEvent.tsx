import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { ArrowLeft } from "lucide-react";
import EventWizard from "@/components/EventWizard/EventWizard";
import { useEvents } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  const [isCreating, setIsCreating] = useState(false);

  const handleWizardComplete = async (data: {
    eventType: string;
    budget: string;
    dateRange: DateRange;
  }) => {
    setIsCreating(true);
    const newEvent = await createEvent(data);
    setIsCreating(false);
    
    if (newEvent) {
      navigate(`/event/${newEvent.id}`);
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Button>
      </div>
      
      {isCreating ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Creating your event...</p>
          </div>
        </div>
      ) : (
        <EventWizard onComplete={handleWizardComplete} />
      )}
    </div>
  );
};

export default CreateEvent;