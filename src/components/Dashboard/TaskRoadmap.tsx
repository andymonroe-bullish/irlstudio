import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Plus, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Phase {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
}

const initialPhases: Phase[] = [
  {
    id: "design",
    name: "Phase 1 - Design",
    color: "bg-phase-design",
    tasks: [
      { id: "d1", title: "Define event objectives & KPIs", completed: false },
      { id: "d2", title: "Create event brand identity", completed: false },
      { id: "d3", title: "Design attendee experience map", completed: false },
      { id: "d4", title: "Plan venue layout", completed: false },
      { id: "d5", title: "Draft speaker lineup", completed: false },
    ],
  },
  {
    id: "build",
    name: "Phase 2 - Build",
    color: "bg-phase-build",
    tasks: [
      { id: "b1", title: "Book venue & vendors", completed: false },
      { id: "b2", title: "Set up registration system", completed: false },
      { id: "b3", title: "Create marketing materials", completed: false },
      { id: "b4", title: "Confirm speakers & schedule", completed: false },
      { id: "b5", title: "Plan catering menu", completed: false },
      { id: "b6", title: "Arrange AV equipment", completed: false },
    ],
  },
  {
    id: "execute",
    name: "Phase 3 - Execute",
    color: "bg-phase-execute",
    tasks: [
      { id: "e1", title: "Send attendee reminders", completed: false },
      { id: "e2", title: "Brief staff & volunteers", completed: false },
      { id: "e3", title: "Set up venue", completed: false },
      { id: "e4", title: "Run event day operations", completed: false },
    ],
  },
  {
    id: "afterglow",
    name: "Phase 4 - Afterglow",
    color: "bg-phase-afterglow",
    tasks: [
      { id: "a1", title: "Send thank you emails", completed: false },
      { id: "a2", title: "Collect feedback surveys", completed: false },
      { id: "a3", title: "Analyze event metrics", completed: false },
      { id: "a4", title: "Create post-event report", completed: false },
    ],
  },
];

const TaskRoadmap = () => {
  const [phases, setPhases] = useState<Phase[]>(initialPhases);
  const [expandedPhases, setExpandedPhases] = useState<string[]>(["design"]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) =>
      prev.includes(phaseId)
        ? prev.filter((id) => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const toggleTask = (phaseId: string, taskId: string) => {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              tasks: phase.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, completed: !task.completed }
                  : task
              ),
            }
          : phase
      )
    );
  };

  const getCompletedCount = (phase: Phase) =>
    phase.tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Task Roadmap</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Track your progress through each phase.
        </p>
      </div>

      <div className="space-y-3">
        {phases.map((phase) => {
          const isExpanded = expandedPhases.includes(phase.id);
          const completed = getCompletedCount(phase);
          const total = phase.tasks.length;
          const progress = (completed / total) * 100;

          return (
            <div key={phase.id} className="overflow-hidden">
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors group"
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.div>

                <span className="font-medium text-foreground">{phase.name}</span>

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
                    {completed}/{total} Tasks
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
                    <div className="pl-12 pr-4 pb-4 space-y-2">
                      {phase.tasks.map((task) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors group cursor-pointer"
                          onClick={() => toggleTask(phase.id, task.id)}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              task.completed
                                ? "bg-primary border-primary"
                                : "border-border group-hover:border-primary/50"
                            }`}
                          >
                            {task.completed && (
                              <Check className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <span
                            className={`text-sm transition-colors ${
                              task.completed
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </span>
                        </motion.div>
                      ))}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 hover:bg-accent mt-2"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Task
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskRoadmap;
