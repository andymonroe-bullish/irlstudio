import { useState, useRef } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Check, Circle, Clock, Trash2, User, ChevronDown, MoreHorizontal, CalendarDays, X, MessageSquare } from "lucide-react";
import { Task, TaskStatus } from "./types";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { TaskComment } from "@/hooks/useTaskDetails";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SubTaskList from "./SubTaskList";
import TaskDetailModal from "./TaskDetailModal";
import { Task as TaskData } from "@/hooks/useEvents";
import { EventMember, memberLabel, memberInitials } from "@/hooks/useEventMembers";

interface TaskItemProps {
  task: Task;
  taskData: TaskData;
  index: number;
  phaseColor: string;
  members: EventMember[];
  commentCount: number;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAssigneeToggle: (taskId: string, userId: string) => void;
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

const TaskItem = ({
  task,
  taskData,
  index,
  phaseColor,
  members,
  commentCount,
  onStatusChange,
  onAssigneeToggle,
  onDelete,
  onUpdateTask,
}: TaskItemProps) => {
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const [subTasksExpanded, setSubTasksExpanded] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Inline comments preview (read-only). Lazily loaded on first expand.
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  // Prefer the freshly-loaded count once we have it, else the event-level count.
  const displayCommentCount = comments ? comments.length : commentCount;

  const authorLabel = (userId: string) => {
    const m = members.find((mm) => mm.userId === userId);
    return m?.email || m?.fullName || "Unknown";
  };

  const toggleComments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !commentsExpanded;
    setCommentsExpanded(next);
    if (next && comments === null) {
      setCommentsLoading(true);
      const { data } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });
      setComments((data as TaskComment[]) || []);
      setCommentsLoading(false);
    }
  };

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

              {/* Assignees - Hidden on mobile */}
              {(() => {
                const assignedIds = task.assigneeIds || [];
                const assignedMembers = members.filter((m) => assignedIds.includes(m.userId));
                const shown = assignedMembers.slice(0, 3);
                const extra = assignedMembers.length - shown.length;
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="hidden sm:flex items-center px-2 py-1 rounded-md hover:bg-secondary transition-colors"
                        title={
                          assignedMembers.length > 0
                            ? assignedMembers.map((m) => memberLabel(m)).join(", ")
                            : "Assign people"
                        }
                      >
                        {assignedMembers.length > 0 ? (
                          <span className="flex items-center -space-x-1.5">
                            {shown.map((m) => (
                              <span
                                key={m.userId}
                                className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium ring-2 ring-card"
                              >
                                {memberInitials(m)}
                              </span>
                            ))}
                            {extra > 0 && (
                              <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-[10px] flex items-center justify-center font-medium ring-2 ring-card">
                                +{extra}
                              </span>
                            )}
                          </span>
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border w-56">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Assign to
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {members.length === 0 ? (
                        <div className="px-2 py-3 text-xs text-muted-foreground">
                          No one to assign yet. Invite collaborators to this event.
                        </div>
                      ) : (
                        members.map((member) => {
                          const isAssigned = assignedIds.includes(member.userId);
                          return (
                            <DropdownMenuItem
                              key={member.userId}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAssigneeToggle(task.id, member.userId);
                              }}
                              className="gap-2"
                            >
                              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium flex-shrink-0">
                                {memberInitials(member)}
                              </span>
                              <span className="flex-1 truncate">
                                {member.email || memberLabel(member)}
                                {member.isOwner && (
                                  <span className="text-muted-foreground"> (owner)</span>
                                )}
                              </span>
                              {isAssigned && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                            </DropdownMenuItem>
                          );
                        })
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}

              {/* Comment count — click to expand inline */}
              {displayCommentCount > 0 && (
                <button
                  onClick={toggleComments}
                  className={cn(
                    "flex items-center gap-1 text-xs px-1.5 py-1 rounded-md transition-colors flex-shrink-0",
                    commentsExpanded
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  title={`${displayCommentCount} comment${displayCommentCount === 1 ? "" : "s"}`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {displayCommentCount}
                </button>
              )}

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
                  setConfirmDeleteOpen(true);
                }}
                className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Inline comments (read-only preview) */}
            {commentsExpanded && (
              <div className="ml-7 sm:ml-8 mr-2 mb-2 space-y-2 border-l-2 border-border pl-3">
                {commentsLoading ? (
                  <p className="text-xs text-muted-foreground py-1">Loading comments…</p>
                ) : comments && comments.length > 0 ? (
                  comments.map((c) => (
                    <div key={c.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{authorLabel(c.user_id)}</span>
                        <span className="text-muted-foreground flex-shrink-0">
                          {format(parseISO(c.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap mt-0.5">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-1">No comments yet.</p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailModalOpen(true);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Open task to reply
                </button>
              </div>
            )}

            {/* Sub-tasks */}
            <SubTaskList
              taskId={task.id}
              isExpanded={subTasksExpanded}
              onToggle={() => setSubTasksExpanded(!subTasksExpanded)}
            />
          </div>
        )}
      </Draggable>

      {/* Delete Confirmation */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{task.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the task along with its sub-tasks,
              attachments, links, and comments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(task.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
