import { useState } from "react";
import { motion } from "framer-motion";
import { DateRange } from "react-day-picker";
import { ListTodo, DollarSign } from "lucide-react";
import EventHeader from "./EventHeader";
import TaskRoadmap from "./TaskRoadmap";
import BudgetManager from "./BudgetManager";

interface EventDashboardProps {
  eventData: {
    eventType: string;
    budget: string;
    dateRange: DateRange;
  };
}

type DashboardView = "tasks" | "budget";

const EventDashboard = ({ eventData }: EventDashboardProps) => {
  const [activeView, setActiveView] = useState<DashboardView>("tasks");
  const budgetNumber = parseInt(eventData.budget.replace(/[^0-9]/g, "")) || 50000;

  const tabs = [
    { id: "tasks" as DashboardView, label: "Tasks", icon: ListTodo },
    { id: "budget" as DashboardView, label: "Budget", icon: DollarSign },
  ];

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

        {/* Toggle Tabs */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center bg-muted/50 rounded-full p-1.5 border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                  ${activeView === tab.id
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {activeView === "tasks" ? (
              <TaskRoadmap />
            ) : (
              <BudgetManager totalBudget={budgetNumber} />
            )}
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl border border-border p-6 shadow-card"
            >
              <h3 className="font-semibold text-foreground mb-4">Countdown</h3>
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
      </motion.div>
    </div>
  );
};

export default EventDashboard;
