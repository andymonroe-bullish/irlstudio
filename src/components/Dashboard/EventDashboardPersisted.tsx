import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ListTodo, DollarSign, TrendingUp, Calendar, StickyNote, Paperclip } from "lucide-react";
import { Event, useEventData } from "@/hooks/useEvents";
import { useEventMembers } from "@/hooks/useEventMembers";
import EventHeaderPersisted from "./EventHeaderPersisted";
import TaskRoadmapPersisted from "./TaskRoadmapPersisted";
import BudgetManagerPersisted from "./BudgetManagerPersisted";
import ProjectionsManagerPersisted from "./ProjectionsManagerPersisted";
import ItineraryManager from "./ItineraryManager";
import NotesManager from "./NotesManager";
import FilesManager from "./FilesManager";

interface EventDashboardPersistedProps {
  event: Event;
}

type DashboardView = "tasks" | "budget" | "projections" | "itinerary" | "notes" | "files";

const VALID_VIEWS: DashboardView[] = ["tasks", "budget", "projections", "itinerary", "notes", "files"];

const EventDashboardPersisted = ({ event }: EventDashboardPersistedProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as DashboardView | null;
  const activeView: DashboardView = tabParam && VALID_VIEWS.includes(tabParam) ? tabParam : "tasks";

  const setActiveView = (view: DashboardView) => {
    setSearchParams({ tab: view }, { replace: true });
  };

  const eventData = useEventData(event.id);
  const { members } = useEventMembers(event.id);

  const tabs = [
    { id: "tasks" as DashboardView, label: "Tasks", icon: ListTodo },
    { id: "budget" as DashboardView, label: "Budget", icon: DollarSign },
    { id: "projections" as DashboardView, label: "Projections", icon: TrendingUp },
    { id: "itinerary" as DashboardView, label: "Itinerary", icon: Calendar },
    { id: "notes" as DashboardView, label: "Notes", icon: StickyNote },
    { id: "files" as DashboardView, label: "Files", icon: Paperclip },
  ];

  const daysUntilEvent = Math.max(
    0,
    Math.ceil(
      (new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  // The overall budget is the live sum of every line item's estimated cost,
  // so editing an estimate immediately updates the Budget total (and Projections).
  const estimatedBudgetTotal = eventData.budgetItems.reduce(
    (sum, item) => sum + (item.estimated_cost || 0),
    0
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
      <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex items-center bg-muted/50 rounded-full p-1 sm:p-1.5 border border-border flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`
                flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${activeView === tab.id
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 gap-6">
        {activeView === "tasks" && (
          <TaskRoadmapPersisted
            tasks={eventData.tasks}
            members={members}
            taskAssignees={eventData.taskAssignees}
            onUpdateTask={eventData.updateTask}
            onUpdateTaskAssignees={eventData.updateTaskAssignees}
            onAddTask={eventData.addTask}
            onDeleteTask={eventData.deleteTask}
            onReorderTasks={eventData.reorderTasks}
            phaseDueDates={eventData.phaseDueDates}
            onUpdatePhaseDueDate={eventData.updatePhaseDueDate}
            daysUntilEvent={daysUntilEvent}
          />
        )}
        {activeView === "budget" && (
          <BudgetManagerPersisted
            totalBudget={estimatedBudgetTotal}
            items={eventData.budgetItems}
            onUpdateItem={eventData.updateBudgetItem}
            onAddItem={eventData.addBudgetItem}
            onDeleteItem={eventData.deleteBudgetItem}
            onReorderItems={eventData.reorderBudgetItems}
          />
        )}
        {activeView === "projections" && (
          <ProjectionsManagerPersisted
            totalBudget={estimatedBudgetTotal}
            streams={eventData.revenueStreams}
            onUpdateStream={eventData.updateRevenueStream}
            onAddStream={eventData.addRevenueStream}
            onDeleteStream={eventData.deleteRevenueStream}
          />
        )}
        {activeView === "itinerary" && (
          <ItineraryManager
            eventId={event.id}
            eventStartDate={event.event_date}
          />
        )}
        {activeView === "notes" && (
          <NotesManager eventId={event.id} />
        )}
        {activeView === "files" && (
          <FilesManager eventId={event.id} />
        )}
      </div>
    </motion.div>
  );
};

export default EventDashboardPersisted;