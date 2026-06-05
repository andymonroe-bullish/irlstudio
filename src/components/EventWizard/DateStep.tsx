import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

interface DateStepProps {
  dateRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
}

const DateStep = ({ dateRange, onDateChange }: DateStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-2">
        When's the{" "}
        <span className="text-primary">big day?</span>
      </h1>
      <p className="text-muted-foreground text-lg mb-12">
        Select your event dates from the calendar.
      </p>

      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-card rounded-2xl border-2 border-border p-4 shadow-card inline-block">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateChange}
            numberOfMonths={2}
            className="rounded-xl"
            classNames={{
              months: "flex flex-col sm:flex-row gap-4",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium text-foreground",
              nav: "space-x-1 flex items-center",
              nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-accent rounded-lg transition-colors",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-10 w-10 text-center text-sm relative p-0 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20",
              day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors",
              day_range_start: "day-range-start bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-l-lg",
              day_range_end: "day-range-end bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-r-lg",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside text-muted-foreground/50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
              day_disabled: "text-muted-foreground/30",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </div>
      </motion.div>

      {dateRange?.from && (
        <motion.p
          className="text-sm text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {dateRange.from.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          {dateRange.to && (
            <> — {dateRange.to.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</>
          )}
        </motion.p>
      )}
    </motion.div>
  );
};

export default DateStep;
