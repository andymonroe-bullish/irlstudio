import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubTask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
}

interface SubTaskListProps {
  taskId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const SubTaskList = ({ taskId, isExpanded, onToggle }: SubTaskListProps) => {
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");

  const fetchSubTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("sub_tasks")
      .select("*")
      .eq("task_id", taskId)
      .order("sort_order");

    if (!error && data) {
      setSubTasks(data);
    }
  }, [taskId]);

  useEffect(() => {
    if (isExpanded) {
      fetchSubTasks();
    }
  }, [isExpanded, fetchSubTasks]);

  const handleAddSubTask = async () => {
    if (!newSubTaskTitle.trim()) return;

    const maxOrder = Math.max(...subTasks.map((s) => s.sort_order), 0);
    const { data, error } = await supabase
      .from("sub_tasks")
      .insert({
        task_id: taskId,
        title: newSubTaskTitle.trim(),
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setSubTasks((prev) => [...prev, data]);
      setNewSubTaskTitle("");
      setIsAddingSubTask(false);
    }
  };

  const handleToggleComplete = async (subTask: SubTask) => {
    const { error } = await supabase
      .from("sub_tasks")
      .update({ completed: !subTask.completed })
      .eq("id", subTask.id);

    if (!error) {
      setSubTasks((prev) =>
        prev.map((s) =>
          s.id === subTask.id ? { ...s, completed: !s.completed } : s
        )
      );
    }
  };

  const handleDeleteSubTask = async (subTaskId: string) => {
    const { error } = await supabase
      .from("sub_tasks")
      .delete()
      .eq("id", subTaskId);

    if (!error) {
      setSubTasks((prev) => prev.filter((s) => s.id !== subTaskId));
    }
  };

  const completedCount = subTasks.filter((s) => s.completed).length;

  return (
    <div className="ml-8 mt-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span>
          Sub-tasks{" "}
          {subTasks.length > 0 && (
            <span className="text-primary">
              ({completedCount}/{subTasks.length})
            </span>
          )}
        </span>
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
            <div className="mt-2 space-y-1 pl-4 border-l-2 border-border">
              {subTasks.map((subTask) => (
                <motion.div
                  key={subTask.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 py-1 group"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleComplete(subTask);
                    }}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
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
                      "flex-1 text-xs",
                      subTask.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {subTask.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubTask(subTask.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}

              {isAddingSubTask ? (
                <div
                  className="flex items-center gap-2 py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    autoFocus
                    value={newSubTaskTitle}
                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubTask();
                      if (e.key === "Escape") {
                        setIsAddingSubTask(false);
                        setNewSubTaskTitle("");
                      }
                    }}
                    placeholder="Sub-task name..."
                    className="h-7 text-xs"
                  />
                  <Button size="sm" className="h-7 text-xs px-2" onClick={handleAddSubTask}>
                    Add
                  </Button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingSubTask(true);
                  }}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 py-1"
                >
                  <Plus className="w-3 h-3" />
                  Add sub-task
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubTaskList;
