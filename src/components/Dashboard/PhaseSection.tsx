import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droppable } from "@hello-pangea/dnd";
import { ChevronRight, Plus, CalendarDays, X } from "lucide-react";
import { Phase, Task, TaskStatus } from "./types";
import TaskItem from "./TaskItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Task as TaskData } from "@/hooks/useEvents";
import { EventMember } from "@/hooks/useEventMembers";
import { format, parseISO } from "date-fns";

interface PhaseSectionProps {
  phase: Phase;
  tasksData: TaskData[];
  members: EventMember[];
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAssigneeToggle: (taskId: string, userId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (title: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskData>) => Promise<void>;
  phaseDueDate: string | null;
  onUpdatePhaseDueDate: (dueDate: string | null) => void;
}

const PhaseSection = ({
  phase,
  tasksData,
  members,
  isExpanded,
  onToggle,
  onStatusChange,
  onAssigneeToggle,
  onDeleteTask,
  onAddTask,
  onUpdateTask,
  phaseDueDate,
  onUpdatePhaseDueDate,
}: PhaseSectionProps) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showDateInput, setShowDateInput] = useState(false);

  const completedCount = phase.tasks.filter((t) => t.status === "completed").length;
  const progress = phase.tasks.length > 0 ? (completedCount / phase.tasks.length) * 100 : 0;

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle("");
      setIsAddingTask(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    } else if (e.key === "Escape") {
      setIsAddingTask(false);
      setNewTaskTitle("");
    }
  };

  const isOverdue = phaseDueDate && new Date(phaseDueDate) < new Date();

  return (
    <div className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-secondary/50 transition-colors group"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        </motion.div>

        <div className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold text-white ${phase.color} truncate max-w-[150px] sm:max-w-none`}>
          <span className="hidden sm:inline">{phase.name}</span>
          <span className="sm:hidden">{phase.name.replace('Phase ', 'P').replace(' - ', ': ')}</span>
        </div>

        <span className="text-xs sm:text-sm text-muted-foreground">{phase.tasks.length}</span>

        <div className="flex-1 flex items-center gap-2 sm:gap-3">
          <div className="w-16 sm:w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${phase.color} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {completedCount}/{phase.tasks.length}
          </span>
        </div>

        {/* Phase Due Date */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowDateInput((v) => !v);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
        >
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          {phaseDueDate ? (
            <span className={`text-xs font-medium whitespace-nowrap ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
              {format(parseISO(phaseDueDate), "MMM d")}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground hidden sm:inline">Set deadline</span>
          )}
          {phaseDueDate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePhaseDueDate(null);
              }}
              className="ml-1 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </button>

      {/* Date picker for phase deadline */}
      <AnimatePresence>
        {showDateInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pl-12 pr-4 pb-2 flex items-center gap-2">
              <input
                type="date"
                defaultValue={phaseDueDate || ""}
                className="h-8 px-2 text-sm rounded-md border border-border bg-background text-foreground"
                onChange={(e) => {
                  onUpdatePhaseDueDate(e.target.value || null);
                  setShowDateInput(false);
                }}
              />
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowDateInput(false)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Droppable droppableId={phase.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`pl-4 sm:pl-12 pr-2 sm:pr-4 pb-4 space-y-1 min-h-[50px] transition-colors ${
                    snapshot.isDraggingOver ? "bg-accent/30 rounded-lg" : ""
                  }`}
                >
                  {phase.tasks.map((task, index) => {
                    const taskData = tasksData.find(t => t.id === task.id);
                    return taskData ? (
                      <TaskItem
                        key={task.id}
                        task={task}
                        taskData={taskData}
                        index={index}
                        phaseColor={phase.color}
                        members={members}
                        onStatusChange={onStatusChange}
                        onAssigneeToggle={onAssigneeToggle}
                        onDelete={onDeleteTask}
                        onUpdateTask={onUpdateTask}
                      />
                    ) : null;
                  })}
                  {provided.placeholder}

                  {isAddingTask ? (
                    <div className="flex items-center gap-2 p-2">
                      <Input
                        autoFocus
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                          if (!newTaskTitle.trim()) {
                            setIsAddingTask(false);
                          }
                        }}
                        placeholder="Enter task name..."
                        className="h-9"
                      />
                      <Button size="sm" onClick={handleAddTask}>
                        Add
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 hover:bg-accent mt-2"
                      onClick={() => setIsAddingTask(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Task
                    </Button>
                  )}
                </div>
              )}
            </Droppable>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhaseSection;
