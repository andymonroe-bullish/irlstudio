import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droppable } from "@hello-pangea/dnd";
import { ChevronRight, Plus } from "lucide-react";
import { Phase, Task, TaskStatus } from "./types";
import TaskItem from "./TaskItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Task as TaskData } from "@/hooks/useEvents";

interface PhaseSectionProps {
  phase: Phase;
  tasksData: TaskData[];
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAssigneeChange: (taskId: string, assignee: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (title: string) => void;
}

const PhaseSection = ({
  phase,
  tasksData,
  isExpanded,
  onToggle,
  onStatusChange,
  onAssigneeChange,
  onDeleteTask,
  onAddTask,
}: PhaseSectionProps) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const completedCount = phase.tasks.filter((t) => t.status === "completed").length;
  const progress = (completedCount / phase.tasks.length) * 100;

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

  return (
    <div className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors group"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.div>

        <div className={`px-3 py-1 rounded-lg text-xs font-semibold text-white ${phase.color}`}>
          {phase.name}
        </div>

        <span className="text-sm text-muted-foreground">{phase.tasks.length}</span>

        <div className="flex-1 flex items-center gap-3">
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${phase.color} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{phase.tasks.length} Tasks
          </span>
        </div>
      </button>

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
                  className={`pl-12 pr-4 pb-4 space-y-1 min-h-[50px] transition-colors ${
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
                        onStatusChange={onStatusChange}
                        onAssigneeChange={onAssigneeChange}
                        onDelete={onDeleteTask}
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
