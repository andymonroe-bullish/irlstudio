import { useState } from "react";
import { DateRange } from "react-day-picker";
import EventWizard from "@/components/EventWizard/EventWizard";
import EventDashboard from "@/components/Dashboard/EventDashboard";

interface EventData {
  eventType: string;
  budget: string;
  dateRange: DateRange;
}

const Index = () => {
  const [eventData, setEventData] = useState<EventData | null>(null);

  const handleWizardComplete = (data: EventData) => {
    setEventData(data);
  };

  if (eventData) {
    return <EventDashboard eventData={eventData} />;
  }

  return <EventWizard onComplete={handleWizardComplete} />;
};

export default Index;
