import { useState } from "react";
import { motion } from "framer-motion";
import { ListTodo, DollarSign, TrendingUp } from "lucide-react";
import { Event, useEventData } from "@/hooks/useEvents";
import EventHeaderPersisted from "./EventHeaderPersisted";
import TaskRoadmapPersisted from "./TaskRoadmapPersisted";
import BudgetManagerPersisted from "./BudgetManagerPersisted";
import ProjectionsManagerPersisted from "./ProjectionsManagerPersisted";

interface EventDashboardPersistedProps {
  event: Event;
}

type DashboardView = "tasks" | "budget" | "projections";

const EventDashboardPersisted = ({ event }: EventDashboardPersistedProps) => {
  const [activeView, setActiveView] = useState<DashboardView>("tasks");
  const eventData = useEventData(event.id);

  const tabs = [
    { id: "tasks" as DashboardView, label: "Tasks", icon: ListTodo },
    { id: "budget" as DashboardView, label: "Budget", icon: DollarSign },
    { id: "projections" as DashboardView, label: "Projections", icon: TrendingUp },
  ];

  const daysUntilEvent = Math.max(
    0,
    Math.ceil(
      (new Date(event.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  if (eventData.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading event data...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <EventHeaderPersisted event={event} />

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
          {activeView === "tasks" && (
            <TaskRoadmapPersisted
              tasks={eventData.tasks}
              onUpdateTask={eventData.updateTask}
              onAddTask={eventData.addTask}
              onDeleteTask={eventData.deleteTask}
              onReorderTasks={eventData.reorderTasks}
            />
          )}
          {activeView === "budget" && (
            <BudgetManagerPersisted
              totalBudget={event.budget}
              items={eventData.budgetItems}
              onUpdateItem={eventData.updateBudgetItem}
              onAddItem={eventData.addBudgetItem}
              onDeleteItem={eventData.deleteBudgetItem}
              onReorderItems={eventData.reorderBudgetItems}
            />
          )}
          {activeView === "projections" && (
            <ProjectionsManagerPersisted
              totalBudget={event.budget}
              streams={eventData.revenueStreams}
              onUpdateStream={eventData.updateRevenueStream}
              onAddStream={eventData.addRevenueStream}
              onDeleteStream={eventData.deleteRevenueStream}
            />
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
                {daysUntilEvent}
              </span>
              <p className="text-sm text-muted-foreground mt-2">
                Days until your event
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventDashboardPersisted;