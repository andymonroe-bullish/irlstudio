import { motion } from "framer-motion";
import { DateRange } from "react-day-picker";
import EventHeader from "./EventHeader";
import QuickStats from "./QuickStats";
import TaskRoadmap from "./TaskRoadmap";
import BudgetManager from "./BudgetManager";

interface EventDashboardProps {
  eventData: {
    eventType: string;
    budget: string;
    dateRange: DateRange;
  };
}

const EventDashboard = ({ eventData }: EventDashboardProps) => {
  const budgetNumber = parseInt(eventData.budget.replace(/[^0-9]/g, "")) || 50000;

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto p-6"
      >
        <EventHeader
          eventType={eventData.eventType}
          budget={eventData.budget}
          dateRange={eventData.dateRange}
        />

        <QuickStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <TaskRoadmap />
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl border border-border p-6 shadow-card"
            >
              <h3 className="font-semibold text-foreground mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {[
                  "Invite team member",
                  "Add vendor contact",
                  "Upload document",
                  "Set reminder",
                ].map((action) => (
                  <button
                    key={action}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl border border-border p-6 shadow-card"
            >
              <h3 className="font-semibold text-foreground mb-4">
                Countdown
              </h3>
              <div className="text-center py-4">
                <span className="text-4xl font-bold text-primary">
                  {eventData.dateRange?.from
                    ? Math.max(
                        0,
                        Math.ceil(
                          (eventData.dateRange.from.getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )
                    : "--"}
                </span>
                <p className="text-sm text-muted-foreground mt-2">
                  Days until your event
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Budget Section - Full Width */}
        <BudgetManager totalBudget={budgetNumber} />
      </motion.div>
    </div>
  );
};

export default EventDashboard;
