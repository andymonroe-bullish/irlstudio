import { useState, useMemo } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Task } from "@/hooks/useEvents";
import { Phase, TaskStatus } from "./types";
import PhaseSection from "./PhaseSection";

interface TaskRoadmapPersistedProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onAddTask: (phaseId: string, title: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onReorderTasks: (tasks: Task[]) => Promise<void>;
  phaseDueDates: Record<string, string>;
  onUpdatePhaseDueDate: (phaseId: string, dueDate: string | null) => Promise<void>;
}

const PHASE_CONFIG = [
  { id: "design", name: "Phase 1 - Design", color: "bg-phase-design" },
  { id: "build", name: "Phase 2 - Build", color: "bg-phase-build" },
  { id: "execute", name: "Phase 3 - Execute", color: "bg-phase-execute" },
  { id: "afterglow", name: "Phase 4 - Afterglow", color: "bg-phase-afterglow" },
];

const TaskRoadmapPersisted = ({
  tasks,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
  onReorderTasks,
  phaseDueDates,
  onUpdatePhaseDueDate,
}: TaskRoadmapPersistedProps) => {
  const [expandedPhases, setExpandedPhases] = useState<string[]>(["design"]);

  // Convert flat tasks to phases structure
  const phases: Phase[] = useMemo(() => {
    return PHASE_CONFIG.map((phaseConfig) => ({
      id: phaseConfig.id,
      name: phaseConfig.name,
      color: phaseConfig.color,
      tasks: tasks
        .filter((t) => t.phase_id === phaseConfig.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status as TaskStatus,
          assignee: t.assignee || undefined,
          dueDate: t.due_date || undefined,
        })),
    }));
  }, [tasks]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) =>
      prev.includes(phaseId)
        ? prev.filter((id) => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const handleStatusChange = (phaseId: string, taskId: string, status: TaskStatus) => {
    onUpdateTask(taskId, { status });
  };

  const handleAssigneeChange = (phaseId: string, taskId: string, assignee: string) => {
    onUpdateTask(taskId, { assignee: assignee || null });
  };

  const handleDeleteTask = (phaseId: string, taskId: string) => {
    onDeleteTask(taskId);
  };

  const handleAddTask = (phaseId: string, title: string) => {
    onAddTask(phaseId, title);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Build new task order
    const allTasks = [...tasks];
    
    // Find the task being moved
    const sourcePhaseId = source.droppableId;
    const destPhaseId = destination.droppableId;
    
    const sourcePhaseTasks = allTasks
      .filter((t) => t.phase_id === sourcePhaseId)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    const [movedTask] = sourcePhaseTasks.splice(source.index, 1);
    
    if (sourcePhaseId === destPhaseId) {
      // Reorder within same phase
      sourcePhaseTasks.splice(destination.index, 0, movedTask);
      
      const updatedTasks = allTasks.map((t) => {
        if (t.phase_id === sourcePhaseId) {
          const index = sourcePhaseTasks.findIndex((st) => st.id === t.id);
          return { ...t, sort_order: index };
        }
        return t;
      });
      
      onReorderTasks(updatedTasks);
    } else {
      // Move to different phase
      const destPhaseTasks = allTasks
        .filter((t) => t.phase_id === destPhaseId)
        .sort((a, b) => a.sort_order - b.sort_order);
      
      movedTask.phase_id = destPhaseId;
      destPhaseTasks.splice(destination.index, 0, movedTask);
      
      const updatedTasks = allTasks.map((t) => {
        if (t.id === movedTask.id) {
          const index = destPhaseTasks.findIndex((dt) => dt.id === t.id);
          return { ...t, phase_id: destPhaseId, sort_order: index };
        }
        if (t.phase_id === sourcePhaseId) {
          const index = sourcePhaseTasks.findIndex((st) => st.id === t.id);
          return { ...t, sort_order: index };
        }
        if (t.phase_id === destPhaseId && t.id !== movedTask.id) {
          const index = destPhaseTasks.findIndex((dt) => dt.id === t.id);
          return { ...t, sort_order: index };
        }
        return t;
      });
      
      onReorderTasks(updatedTasks);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Task Roadmap</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Track your progress through each phase.
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-3">
          {phases.map((phase) => (
            <PhaseSection
              key={phase.id}
              phase={phase}
              tasksData={tasks}
              isExpanded={expandedPhases.includes(phase.id)}
              onToggle={() => togglePhase(phase.id)}
              onStatusChange={(taskId, status) =>
                handleStatusChange(phase.id, taskId, status)
              }
              onAssigneeChange={(taskId, assignee) =>
                handleAssigneeChange(phase.id, taskId, assignee)
              }
              onDeleteTask={(taskId) => handleDeleteTask(phase.id, taskId)}
              onAddTask={(title) => handleAddTask(phase.id, title)}
              onUpdateTask={onUpdateTask}
              phaseDueDate={phaseDueDates[phase.id] || null}
              onUpdatePhaseDueDate={(dueDate) => onUpdatePhaseDueDate(phase.id, dueDate)}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TaskRoadmapPersisted;