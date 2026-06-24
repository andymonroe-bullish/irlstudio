import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Phase, Task, TaskStatus, getInitialPhases } from "./types";
import PhaseSection from "./PhaseSection";

interface TaskRoadmapProps {
  initialPhases?: Phase[];
}

const TaskRoadmap = ({ initialPhases }: TaskRoadmapProps) => {
  const [phases, setPhases] = useState<Phase[]>(initialPhases || getInitialPhases());
  const [expandedPhases, setExpandedPhases] = useState<string[]>(["design"]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) =>
      prev.includes(phaseId)
        ? prev.filter((id) => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const handleStatusChange = (phaseId: string, taskId: string, status: TaskStatus) => {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              tasks: phase.tasks.map((task) =>
                task.id === taskId ? { ...task, status } : task
              ),
            }
          : phase
      )
    );
  };

  const handleAssigneeToggle = (taskId: string, userId: string) => {
    setPhases((prev) =>
      prev.map((phase) => ({
        ...phase,
        tasks: phase.tasks.map((task) => {
          if (task.id !== taskId) return task;
          const current = task.assigneeIds || [];
          const next = current.includes(userId)
            ? current.filter((id) => id !== userId)
            : [...current, userId];
          return { ...task, assigneeIds: next };
        }),
      }))
    );
  };

  const handleDeleteTask = (phaseId: string, taskId: string) => {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              tasks: phase.tasks.filter((task) => task.id !== taskId),
            }
          : phase
      )
    );
  };

  const handleAddTask = (phaseId: string, title: string) => {
    const newTask: Task = {
      id: `${phaseId}-${Date.now()}`,
      title,
      status: "not_started",
    };
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id === phaseId
          ? { ...phase, tasks: [...phase.tasks, newTask] }
          : phase
      )
    );
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

    setPhases((prev) => {
      const newPhases = [...prev];
      const sourcePhaseIndex = newPhases.findIndex((p) => p.id === source.droppableId);
      const destPhaseIndex = newPhases.findIndex((p) => p.id === destination.droppableId);

      const sourcePhase = { ...newPhases[sourcePhaseIndex] };
      const sourceTasks = [...sourcePhase.tasks];
      const [movedTask] = sourceTasks.splice(source.index, 1);

      if (source.droppableId === destination.droppableId) {
        // Reorder within same phase
        sourceTasks.splice(destination.index, 0, movedTask);
        sourcePhase.tasks = sourceTasks;
        newPhases[sourcePhaseIndex] = sourcePhase;
      } else {
        // Move to different phase
        const destPhase = { ...newPhases[destPhaseIndex] };
        const destTasks = [...destPhase.tasks];
        destTasks.splice(destination.index, 0, movedTask);
        
        sourcePhase.tasks = sourceTasks;
        destPhase.tasks = destTasks;
        
        newPhases[sourcePhaseIndex] = sourcePhase;
        newPhases[destPhaseIndex] = destPhase;
      }

      return newPhases;
    });
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
          {phases.map((phase) => {
            // Convert local tasks to TaskData format for compatibility
            const tasksData = phase.tasks.map(t => ({
              id: t.id,
              event_id: "",
              phase_id: phase.id,
              title: t.title,
              status: t.status,
              assignee: null,
              due_date: t.dueDate || null,
              sort_order: 0,
            }));
            return (
              <PhaseSection
                key={phase.id}
                phase={phase}
                tasksData={tasksData}
                members={[]}
                taskCommentCounts={{}}
                isExpanded={expandedPhases.includes(phase.id)}
                onToggle={() => togglePhase(phase.id)}
                onStatusChange={(taskId, status) =>
                  handleStatusChange(phase.id, taskId, status)
                }
                onAssigneeToggle={handleAssigneeToggle}
                onDeleteTask={(taskId) => handleDeleteTask(phase.id, taskId)}
                onAddTask={(title) => handleAddTask(phase.id, title)}
                onUpdateTask={async () => {}}
                phaseDueDate={null}
                onUpdatePhaseDueDate={() => {}}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TaskRoadmap;
