import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Plus,
  Link as LinkIcon,
  File,
  MessageSquare,
  Trash2,
  Check,
  Square,
  CheckSquare,
  ExternalLink,
  Upload,
  CalendarDays,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTaskDetails } from "@/hooks/useTaskDetails";
import SubTaskAttachments from "./SubTaskAttachments";
import { Task } from "@/hooks/useEvents";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskDetailModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

const TaskDetailModal = ({ task, open, onClose, onUpdateTask }: TaskDetailModalProps) => {
  const {
    subTasks,
    files,
    links,
    comments,
    loading,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    addLink,
    deleteLink,
    addComment,
    deleteComment,
    uploadFile,
    deleteFile,
    refetch,
  } = useTaskDetails(task.id);

  // The modal stays mounted while the task list is on screen, so data loaded
  // at mount goes stale; refresh it every time the modal is opened.
  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  const [newSubTask, setNewSubTask] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSubTask = () => {
    if (newSubTask.trim()) {
      addSubTask(newSubTask.trim());
      setNewSubTask("");
      setIsAddingSubTask(false);
    }
  };

  const handleAddLink = () => {
    if (newLinkTitle.trim() && newLinkUrl.trim()) {
      addLink(newLinkTitle.trim(), newLinkUrl.trim());
      setNewLinkTitle("");
      setNewLinkUrl("");
      setIsAddingLink(false);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(newComment.trim());
      setNewComment("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
      e.target.value = "";
    }
  };

  const completedSubTasks = subTasks.filter((s) => s.completed).length;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{task.title}</DialogTitle>
          {/* Due Date Row */}
          <div className="flex items-center gap-2 pt-1">
            <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">Due date:</span>
            <input
              type="date"
              defaultValue={task.due_date || ""}
              className="h-7 px-2 text-sm rounded-md border border-border bg-background text-foreground"
              onChange={(e) => {
                onUpdateTask(task.id, { due_date: e.target.value || null });
              }}
            />
            {task.due_date && (
              <button
                onClick={() => onUpdateTask(task.id, { due_date: null })}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <Tabs defaultValue="subtasks" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="subtasks" className="gap-2">
                <CheckSquare className="w-4 h-4" />
                Sub-tasks
                {subTasks.length > 0 && (
                  <span className="text-xs bg-muted px-1.5 rounded">
                    {completedSubTasks}/{subTasks.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2">
                <File className="w-4 h-4" />
                Files
                {files.length > 0 && (
                  <span className="text-xs bg-muted px-1.5 rounded">{files.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="links" className="gap-2">
                <LinkIcon className="w-4 h-4" />
                Links
                {links.length > 0 && (
                  <span className="text-xs bg-muted px-1.5 rounded">{links.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments
                {comments.length > 0 && (
                  <span className="text-xs bg-muted px-1.5 rounded">{comments.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              {/* Sub-tasks Tab */}
              <TabsContent value="subtasks" className="m-0 space-y-3">
                {subTasks.map((subTask) => (
                  <motion.div
                    key={subTask.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 group"
                  >
                    <button
                      onClick={() =>
                        updateSubTask(subTask.id, { completed: !subTask.completed })
                      }
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        subTask.completed
                          ? "bg-primary border-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {subTask.completed && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        subTask.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {subTask.title}
                    </span>
                    <SubTaskAttachments subTaskId={subTask.id} />
                    <button
                      onClick={() => deleteSubTask(subTask.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}

                {isAddingSubTask ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      value={newSubTask}
                      onChange={(e) => setNewSubTask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSubTask();
                        if (e.key === "Escape") {
                          setIsAddingSubTask(false);
                          setNewSubTask("");
                        }
                      }}
                      placeholder="Enter sub-task..."
                      className="h-9"
                    />
                    <Button size="sm" onClick={handleAddSubTask}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingSubTask(false);
                        setNewSubTask("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80"
                    onClick={() => setIsAddingSubTask(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Sub-task
                  </Button>
                )}
              </TabsContent>

              {/* Files Tab */}
              <TabsContent value="files" className="m-0 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <File className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.file_size
                          ? `${(file.file_size / 1024).toFixed(1)} KB`
                          : "Unknown size"}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteFile(file.id, file.file_url)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </Button>
              </TabsContent>

              {/* Links Tab */}
              <TabsContent value="links" className="m-0 space-y-3">
                {links.map((link) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <LinkIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{link.title}</p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate block"
                      >
                        {link.url}
                      </a>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-muted transition-all"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}

                {isAddingLink ? (
                  <div className="space-y-2">
                    <Input
                      autoFocus
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="Link title..."
                      className="h-9"
                    />
                    <Input
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-9"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddLink();
                        if (e.key === "Escape") {
                          setIsAddingLink(false);
                          setNewLinkTitle("");
                          setNewLinkUrl("");
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddLink}>
                        Add Link
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingLink(false);
                          setNewLinkTitle("");
                          setNewLinkUrl("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80"
                    onClick={() => setIsAddingLink(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Link
                  </Button>
                )}
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments" className="m-0 space-y-4">
                <div className="space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="min-h-[80px] resize-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Post Comment
                  </Button>
                </div>

                <div className="space-y-3">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-muted/30 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
