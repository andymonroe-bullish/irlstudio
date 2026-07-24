import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Pencil } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Event } from "@/hooks/useEvents";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EventHeaderPersistedProps {
  event: Event;
  onEventUpdated?: (updates: Partial<Event>) => void;
}

const EventHeaderPersisted = ({ event, onEventUpdated }: EventHeaderPersistedProps) => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(event.event_date),
    to: event.event_end_date ? new Date(event.event_end_date) : undefined,
  });
  const { toast } = useToast();

  const eventTypeLabels: Record<string, string> = {
    mastermind: "Mastermind",
    fulfillment: "Fulfillment",
    acquisition: "Acquisition",
    activation: "Activation",
    networking: "Networking",
  };

  const handleSelect = (newRange: DateRange | undefined, day: Date) => {
    // A click while a complete range is shown starts a fresh selection;
    // otherwise react-day-picker would extend the existing range.
    if (range?.from && range?.to) {
      setRange({ from: day, to: undefined });
      return;
    }
    if (!newRange?.from) {
      // Clicked the pending start day again → single-day event
      saveDates({ from: day, to: undefined });
      return;
    }
    saveDates(newRange);
  };

  const saveDates = async (newRange: DateRange) => {
    setRange(newRange);
    if (!newRange.from) return;

    const isMultiDay =
      newRange.to && newRange.to.getTime() !== newRange.from.getTime();
    const updates = {
      event_date: newRange.from.toISOString(),
      event_end_date: isMultiDay ? newRange.to!.toISOString() : null,
    };

    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", event.id)
      .select();

    if (error || !data?.length) {
      // RLS denials surface as an empty result rather than an error
      toast({
        title: "Error updating event dates",
        description: error?.message || "You don't have permission to change this event's dates.",
        variant: "destructive",
      });
      setRange({
        from: new Date(event.event_date),
        to: event.event_end_date ? new Date(event.event_end_date) : undefined,
      });
      return;
    }

    onEventUpdated?.(updates);
    setDatePickerOpen(false);
    toast({ title: "Event dates updated" });
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
            {eventTypeLabels[event.type] || event.type} Event
          </span>
          <h1 className="text-3xl font-bold text-foreground mt-1">
            Event Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Popover
            open={datePickerOpen}
            onOpenChange={(open) => {
              setDatePickerOpen(open);
              if (open) {
                setRange({
                  from: new Date(event.event_date),
                  to: event.event_end_date ? new Date(event.event_end_date) : undefined,
                });
              }
            }}
          >
            <PopoverTrigger asChild>
              <button
                className="group flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border hover:border-primary/50 transition-colors"
                title="Change event dates"
              >
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(new Date(event.event_date), "MMM d, yyyy")}
                  {event.event_end_date && ` - ${format(new Date(event.event_end_date), "MMM d, yyyy")}`}
                </span>
                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0 bg-card border-border">
              <Calendar
                mode="range"
                selected={range}
                onSelect={handleSelect}
                defaultMonth={range?.from}
                numberOfMonths={1}
              />
              <p className="px-3 pb-3 text-xs text-muted-foreground">
                Pick a start and end date. Click one day twice for a single-day event.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </motion.div>
  );
};

export default EventHeaderPersisted;
