import { motion } from "framer-motion";
import { Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Event } from "@/hooks/useEvents";

interface EventHeaderPersistedProps {
  event: Event;
}

const EventHeaderPersisted = ({ event }: EventHeaderPersistedProps) => {
  const eventTypeLabels: Record<string, string> = {
    mastermind: "Mastermind",
    fulfillment: "Fulfillment",
    acquisition: "Acquisition",
    activation: "Activation",
    networking: "Networking",
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            {eventTypeLabels[event.event_type] || event.event_type} Event
          </span>
          <h1 className="text-3xl font-bold text-foreground mt-1">
            Event Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(new Date(event.start_date), "MMM d, yyyy")}
              {event.end_date && ` - ${format(new Date(event.end_date), "MMM d, yyyy")}`}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{formatCurrency(event.budget)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventHeaderPersisted;