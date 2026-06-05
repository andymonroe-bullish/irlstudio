import { useState, useRef } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Check, Circle, Clock, Trash2, User, ChevronDown, MoreHorizontal, CalendarDays, X } from "lucide-react";
import { Task, TaskStatus } from "./types";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SubTaskList from "./SubTaskList";
import TaskDetailModal from "./TaskDetailModal";
import { Task as TaskData } from "@/hooks/useEvents";

interface TaskItemProps {
  task: Task;
  taskData: TaskData;
  index: number;
  phaseColor: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAssigneeChange: (taskId: string, assignee: string) => void;
  onDelete: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskData>) => Promise<void>;
}

const statusConfig = {
  not_started: {
    label: "Not Started",
    icon: Circle,
    className: "bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-700",
  },
  completed: {
    label: "Completed",
    icon: Check,
    className: "bg-green-100 text-green-700",
  },
};

const teamMembers = ["Alex", "Jordan", "Sam", "Taylor", "Morgan"];

const TaskItem = ({
  task,
  taskData,
  index,
  phaseColor,
  onStatusChange,
  onAssigneeChange,
  onDelete,
  onUpdateTask,
}: TaskItemProps) => {
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const [subTasksExpanded, setSubTasksExpanded] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const hasDate = !!taskData.due_date;
  const isOverdue = hasDate && task.status !== "completed" && isPast(parseISO(taskData.due_date!));

  const handleDateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDatePicker(true);
    setTimeout(() => dateInputRef.current?.showPicker?.(), 50);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onUpdateTask(task.id, { due_date: e.target.value || null });
    setShowDatePicker(false);
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateTask(task.id, { due_date: null });
  };

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "group transition-all",
              snapshot.isDragging && "shadow-lg bg-card border border-primary/20 rounded-lg"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all",
                "hover:bg-secondary/30 cursor-pointer"
              )}
              onClick={() => setDetailModalOpen(true)}
            >
              {/* Status Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                      task.status === "completed"
                        ? "bg-primary border-primary"
                        : task.status === "in_progress"
                        ? "border-yellow-500 bg-yellow-100"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {task.status === "completed" && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                    {task.status === "in_progress" && (
                      <Clock className="w-3 h-3 text-yellow-600" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-card border-border">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, key as TaskStatus);
                      }}
                      className="gap-2"
                    >
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Title */}
              <span
                className={cn(
                  "flex-1 text-sm transition-colors truncate min-w-0",
                  task.status === "completed"
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {task.title}
              </span>

              {/* Due Date — always visible, inline editable */}
              <div
                className="hidden sm:flex items-center gap-1 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {showDatePicker ? (
                  <input
                    ref={dateInputRef}
                    type="date"
                    defaultValue={taskData.due_date || ""}
                    autoFocus
                    className="h-6 px-1.5 text-xs rounded border border-border bg-background text-foreground w-32"
                    onChange={handleDateChange}
                    onBlur={() => setShowDatePicker(false)}
                  />
                ) : hasDate ? (
                  <span
                    onClick={handleDateClick}
                    className={cn(
                      "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded cursor-pointer transition-colors",
                      isOverdue
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <CalendarDays className="w-3 h-3" />
                    {format(parseISO(taskData.due_date!), "MMM d")}
                    {task.status !== "completed" && (
                      <button
                        onClick={handleClearDate}
                        className="ml-0.5 hover:text-destructive transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                ) : (
                  <button
                    onClick={handleDateClick}
                    className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <CalendarDays className="w-3 h-3" />
                    <span>Set date</span>
                  </button>
                )}
              </div>

              {/* Assignee - Hidden on mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md hover:bg-secondary transition-colors"
                  >
                    {task.assignee ? (
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                        {task.assignee.charAt(0)}
                      </span>
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssigneeChange(task.id, ""); }}>
                    <User className="w-4 h-4 mr-2 text-muted-foreground" />
                    Unassigned
                  </DropdownMenuItem>
                  {teamMembers.map((member) => (
                    <DropdownMenuItem
                      key={member}
                      onClick={(e) => { e.stopPropagation(); onAssigneeChange(task.id, member); }}
                    >
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium mr-2">
                        {member.charAt(0)}
                      </span>
                      {member}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Badge */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "px-1.5 sm:px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 flex-shrink-0",
                      status.className
                    )}
                  >
                    <span className="hidden sm:inline">{status.label}</span>
                    <StatusIcon className="w-3 h-3 sm:hidden" />
                    <ChevronDown className="w-3 h-3 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, key as TaskStatus);
                      }}
                      className="gap-2"
                    >
                      <span className={cn("px-2 py-0.5 rounded text-xs", config.className)}>
                        {config.label}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More Options */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailModalOpen(true);
                }}
                className="p-1 rounded hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tasks */}
            <SubTaskList
              taskId={task.id}
              isExpanded={subTasksExpanded}
              onToggle={() => setSubTasksExpanded(!subTasksExpanded)}
            />
          </div>
        )}
      </Draggable>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={taskData}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onUpdateTask={onUpdateTask}
      />
    </>
  );
};

export default TaskItem;
