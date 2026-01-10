import { motion } from "framer-motion";
import { Calendar, DollarSign, Tag, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";

interface EventHeaderProps {
  eventType: string;
  budget: string;
  dateRange: DateRange;
}

const eventTypeLabels: Record<string, string> = {
  mastermind: "Mastermind",
  fulfillment: "Fulfillment Event",
  acquisition: "Acquisition Event",
  activation: "Activation Event",
  networking: "Networking Event",
};

const EventHeader = ({ eventType, budget, dateRange }: EventHeaderProps) => {
  const formatDateRange = () => {
    if (!dateRange.from) return "";
    const from = dateRange.from.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!dateRange.to) return from;
    const to = dateRange.to.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${from} - ${to}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Your {eventTypeLabels[eventType]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Let's make this event unforgettable.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-accent rounded-xl">
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-accent-foreground">
            {eventTypeLabels[eventType]}
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-accent rounded-xl">
          <DollarSign className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-accent-foreground">
            ${budget} Budget
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-accent rounded-xl">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-accent-foreground">
            {formatDateRange()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default EventHeader;
