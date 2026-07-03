import { useState, useMemo } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus, Megaphone } from "lucide-react";
import { Task as TaskData } from "@/hooks/useEvents";
import { EventMember } from "@/hooks/useEventMembers";
import { TaskStatus } from "./types";
import TaskItem from "./TaskItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Promotion tasks live in the same tasks table as the roadmap, under this
// phase_id. The roadmap only renders its four known phases, so these tasks
// never leak into the Event Design view (and vice versa).
export const PROMOTION_PHASE_ID = "promotion";

interface PromotionTasksPersistedProps {
  tasks: TaskData[];
  members: EventMember[];
  taskAssignees: Record<string, string[]>;
  taskCommentCounts: Record<string, number>;
  onUpdateTask: (taskId: string, updates: Partial<TaskData>) => Promise<void>;
  onUpdateTaskAssignees: (taskId: string, userIds: string[]) => Promise<void>;
  onAddTask: (phaseId: string, title: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onReorderTasks: (tasks: TaskData[]) => Promise<void>;
}

const PromotionTasksPersisted = ({
  tasks,
  members,
  taskAssignees,
  taskCommentCounts,
  onUpdateTask,
  onUpdateTaskAssignees,
  onAddTask,
  onDeleteTask,
  onReorderTasks,
}: PromotionTasksPersistedProps) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const promotionTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.phase_id === PROMOTION_PHASE_ID)
        .sort((a, b) => a.sort_order - b.sort_order),
    [tasks]
  );

  const uiTasks = useMemo(
    () =>
      promotionTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status as TaskStatus,
        assigneeIds: taskAssignees[t.id] || [],
        dueDate: t.due_date || undefined,
      })),
    [promotionTasks, taskAssignees]
  );

  const completedCount = uiTasks.filter((t) => t.status === "completed").length;

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(PROMOTION_PHASE_ID, newTaskTitle.trim());
      setNewTaskTitle("");
      setIsAddingTask(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddTask();
    else if (e.key === "Escape") {
      setIsAddingTask(false);
      setNewTaskTitle("");
    }
  };

  const handleAssigneeToggle = (taskId: string, userId: string) => {
    const current = taskAssignees[taskId] || [];
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    onUpdateTaskAssignees(taskId, next);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;

    const reordered = [...promotionTasks];
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    const updatedTasks = tasks.map((t) => {
      const index = reordered.findIndex((rt) => rt.id === t.id);
      return index === -1 ? t : { ...t, sort_order: index };
    });
    onReorderTasks(updatedTasks);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Promotion Tasks</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage everything it takes to fill the room.
          </p>
        </div>
        <div className="text-center bg-muted/50 rounded-xl px-4 py-2 border border-border flex-shrink-0">
          <span className="text-2xl font-bold text-primary block">
            {completedCount}/{uiTasks.length}
          </span>
          <span className="text-xs text-muted-foreground">done</span>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={PROMOTION_PHASE_ID}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-1 min-h-[50px] transition-colors ${
                snapshot.isDraggingOver ? "bg-accent/30 rounded-lg" : ""
              }`}
            >
              {uiTasks.length === 0 && !isAddingTask && (
                <div className="text-center py-10">
                  <Megaphone className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No promotion tasks yet. Add your first one — email blasts,
                    social posts, outreach, ads…
                  </p>
                </div>
              )}

              {uiTasks.map((task, index) => {
                const taskData = promotionTasks.find((t) => t.id === task.id);
                return taskData ? (
                  <TaskItem
                    key={task.id}
                    task={task}
                    taskData={taskData}
                    index={index}
                    phaseColor="bg-primary"
                    members={members}
                    commentCount={taskCommentCounts[task.id] || 0}
                    onStatusChange={(taskId, status) => onUpdateTask(taskId, { status })}
                    onAssigneeToggle={handleAssigneeToggle}
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
                      if (!newTaskTitle.trim()) setIsAddingTask(false);
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
      </DragDropContext>
    </div>
  );
};

export default PromotionTasksPersisted;
