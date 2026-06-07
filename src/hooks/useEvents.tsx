import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { getInitialPhases, getInitialBudgetItems } from "@/components/Dashboard/types";

export interface Event {
  id: string;
  created_by: string;
  type: string;
  name: string | null;
  slug: string | null;
  total_budget: number;
  event_date: string;
  event_end_date: string | null;
  created_at: string;
  updated_at: string;
  phase_due_dates?: Record<string, string>;
}

const generateSlug = (name: string, id: string): string => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
  // Append short ID suffix to guarantee uniqueness
  const suffix = id.substring(0, 6);
  return base ? `${base}-${suffix}` : id;
};

export interface Task {
  id: string;
  event_id: string;
  phase_id: string;
  title: string;
  status: string;
  assignee: string | null;
  due_date: string | null;
  sort_order: number;
}

export interface BudgetItem {
  id: string;
  event_id: string;
  name: string;
  category: string;
  estimated_cost: number;
  actual_cost: number;
  due_date: string | null;
  status: string;
  sort_order: number;
}

export interface RevenueStream {
  id: string;
  event_id: string;
  name: string;
  price: number;
  projected_volume: number;
  sort_order: number;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch events the user owns AND events they're a collaborator on
      const [ownedRes, collabRes] = await Promise.all([
        supabase
          .from("events")
          .select("*")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("event_collaborators")
          .select("event_id")
          .eq("user_id", user.id),
      ]);

      if (ownedRes.error) throw ownedRes.error;

      let allEvents = ownedRes.data || [];

      // Fetch the collaborated events themselves
      if (collabRes.data && collabRes.data.length > 0) {
        const collabEventIds = collabRes.data.map(c => c.event_id);
        const { data: collabEvents, error: collabEventsError } = await supabase
          .from("events")
          .select("*")
          .in("id", collabEventIds)
          .order("created_at", { ascending: false });

        if (!collabEventsError && collabEvents) {
          // Merge, avoiding duplicates
          const ownedIds = new Set(allEvents.map(e => e.id));
          const newEvents = collabEvents.filter(e => !ownedIds.has(e.id));
          allEvents = [...allEvents, ...newEvents];
        }
      }

      setEvents(allEvents);
    } catch (error: any) {
      toast({
        title: "Error fetching events",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData: {
    eventType: string;
    budget: string;
    dateRange: DateRange;
  }) => {
    if (!user) return null;

    try {
      const budgetNumber = parseInt(eventData.budget.replace(/[^0-9]/g, "")) || 50000;

      const eventTypeLabels: Record<string, string> = {
        mastermind: "Mastermind", fulfillment: "Fulfillment",
        acquisition: "Acquisition", activation: "Activation", networking: "Networking",
      };
      const defaultName = `${eventTypeLabels[eventData.eventType] || eventData.eventType} Event`;

      const { data: newEvent, error: eventError } = await supabase
        .from("events")
        .insert({
          created_by: user.id,
          type: eventData.eventType,
          name: defaultName,
          status: "draft",
          total_budget: budgetNumber,
          event_date: eventData.dateRange.from?.toISOString(),
          event_end_date: eventData.dateRange.to?.toISOString() || null,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Generate and save slug
      const slug = generateSlug(defaultName, newEvent.id);
      await supabase.from("events").update({ slug }).eq("id", newEvent.id);
      newEvent.slug = slug;

      // Create initial tasks
      const initialPhases = getInitialPhases();
      const tasksToInsert = initialPhases.flatMap((phase, phaseIndex) =>
        phase.tasks.map((task, taskIndex) => ({
          event_id: newEvent.id,
          phase_id: phase.id,
          title: task.title,
          status: task.status,
          assignee: task.assignee || null,
          due_date: task.dueDate || null,
          sort_order: phaseIndex * 100 + taskIndex,
          created_by: user.id,
        }))
      );

      const { error: tasksError } = await supabase.from("tasks").insert(tasksToInsert);
      if (tasksError) throw tasksError;

      // Create initial budget items
      const initialBudgetItems = getInitialBudgetItems(budgetNumber);
      const budgetItemsToInsert = initialBudgetItems.map((item, index) => ({
        event_id: newEvent.id,
        name: item.name,
        category: item.category,
        estimated_cost: item.estimatedCost,
        actual_cost: item.actualCost,
        due_date: item.dueDate,
        status: item.status,
        sort_order: index,
        created_by: user.id,
      }));

      const { error: budgetError } = await supabase.from("budget_items").insert(budgetItemsToInsert);
      if (budgetError) throw budgetError;

      // Create initial revenue streams
      const initialRevenueStreams = [
        { name: "Core Mastermind Seat", price: 1600, projected_volume: 15 },
        { name: "Premium Mastermind Pass", price: 2200, projected_volume: 10 },
        { name: "Exclusive Partner Sponsorship", price: 4000, projected_volume: 1 },
        { name: "Post-Mastermind Group Coaching", price: 750, projected_volume: 5 },
      ];

      const { error: revenueError } = await supabase.from("revenue_streams").insert(
        initialRevenueStreams.map((s, i) => ({ ...s, event_id: newEvent.id, sort_order: i }))
      );
      if (revenueError) throw revenueError;

      await fetchEvents();

      toast({ title: "Event created!", description: "Your event has been created successfully." });
      return newEvent;
    } catch (error: any) {
      toast({ title: "Error creating event", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;
      await fetchEvents();
      toast({ title: "Event deleted" });
    } catch (error: any) {
      toast({ title: "Error deleting event", description: error.message, variant: "destructive" });
    }
  };

  const updateEventName = async (eventId: string, name: string) => {
    try {
      const slug = generateSlug(name, eventId);
      const { error } = await supabase.from("events").update({ name, slug }).eq("id", eventId);
      if (error) throw error;
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, name, slug } : e));
      toast({ title: "Event renamed" });
    } catch (error: any) {
      toast({ title: "Error renaming event", description: error.message, variant: "destructive" });
    }
  };

  return { events, loading, createEvent, deleteEvent, updateEventName, refetch: fetchEvents };
};

export const useEventData = (eventId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([]);
  const [phaseDueDates, setPhaseDueDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEventData = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const [tasksRes, budgetRes, revenueRes, eventRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("event_id", eventId).order("sort_order"),
        supabase.from("budget_items").select("*").eq("event_id", eventId).order("sort_order"),
        supabase.from("revenue_streams").select("*").eq("event_id", eventId).order("sort_order"),
        supabase.from("events").select("phase_due_dates").eq("id", eventId).single(),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (budgetRes.error) throw budgetRes.error;
      if (revenueRes.error) throw revenueRes.error;

      setTasks(tasksRes.data || []);
      setBudgetItems(budgetRes.data || []);
      setRevenueStreams(revenueRes.data || []);
      if (eventRes.data?.phase_due_dates) {
        setPhaseDueDates(eventRes.data.phase_due_dates as Record<string, string>);
      }
    } catch (error: any) {
      toast({ title: "Error fetching event data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => { fetchEventData(); }, [fetchEventData]);

  const updatePhaseDueDate = async (phaseId: string, dueDate: string | null) => {
    const newPhaseDueDates = { ...phaseDueDates };
    if (dueDate) { newPhaseDueDates[phaseId] = dueDate; } else { delete newPhaseDueDates[phaseId]; }
    setPhaseDueDates(newPhaseDueDates);
    try {
      const { error } = await supabase.from("events").update({ phase_due_dates: newPhaseDueDates }).eq("id", eventId);
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error updating phase due date", description: error.message, variant: "destructive" });
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    } catch (error: any) {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
    }
  };

  const addTask = async (phaseId: string, title: string) => {
    try {
      const maxOrder = Math.max(...tasks.filter(t => t.phase_id === phaseId).map(t => t.sort_order), 0);
      const { data, error } = await supabase
        .from("tasks")
        .insert({ event_id: eventId, phase_id: phaseId, title, status: "not_started", sort_order: maxOrder + 1 })
        .select().single();
      if (error) throw error;
      setTasks(prev => [...prev, data]);
    } catch (error: any) {
      toast({ title: "Error adding task", description: error.message, variant: "destructive" });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error: any) {
      toast({ title: "Error deleting task", description: error.message, variant: "destructive" });
    }
  };

  const reorderTasks = async (reorderedTasks: Task[]) => {
    setTasks(reorderedTasks);
    try {
      for (const task of reorderedTasks) {
        await supabase.from("tasks").update({ sort_order: task.sort_order, phase_id: task.phase_id }).eq("id", task.id);
      }
    } catch (error: any) {
      toast({ title: "Error reordering tasks", description: error.message, variant: "destructive" });
    }
  };

  const updateBudgetItem = async (itemId: string, updates: Partial<BudgetItem>) => {
    try {
      const { error } = await supabase.from("budget_items").update(updates).eq("id", itemId);
      if (error) throw error;
      setBudgetItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
    } catch (error: any) {
      toast({ title: "Error updating budget item", description: error.message, variant: "destructive" });
    }
  };

  const addBudgetItem = async (item: Omit<BudgetItem, "id" | "event_id" | "sort_order">) => {
    try {
      const maxOrder = Math.max(...budgetItems.map(i => i.sort_order), 0);
      const { data, error } = await supabase
        .from("budget_items")
        .insert({ event_id: eventId, ...item, sort_order: maxOrder + 1 })
        .select().single();
      if (error) throw error;
      setBudgetItems(prev => [...prev, data]);
    } catch (error: any) {
      toast({ title: "Error adding budget item", description: error.message, variant: "destructive" });
    }
  };

  const deleteBudgetItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("budget_items").delete().eq("id", itemId);
      if (error) throw error;
      setBudgetItems(prev => prev.filter(i => i.id !== itemId));
    } catch (error: any) {
      toast({ title: "Error deleting budget item", description: error.message, variant: "destructive" });
    }
  };

  const reorderBudgetItems = async (reorderedItems: BudgetItem[]) => {
    setBudgetItems(reorderedItems);
    try {
      for (let i = 0; i < reorderedItems.length; i++) {
        await supabase.from("budget_items").update({ sort_order: i }).eq("id", reorderedItems[i].id);
      }
    } catch (error: any) {
      toast({ title: "Error reordering budget items", description: error.message, variant: "destructive" });
    }
  };

  const updateRevenueStream = async (streamId: string, updates: Partial<RevenueStream>) => {
    try {
      const { error } = await supabase.from("revenue_streams").update(updates).eq("id", streamId);
      if (error) throw error;
      setRevenueStreams(prev => prev.map(s => s.id === streamId ? { ...s, ...updates } : s));
    } catch (error: any) {
      toast({ title: "Error updating revenue stream", description: error.message, variant: "destructive" });
    }
  };

  const addRevenueStream = async () => {
    try {
      const maxOrder = Math.max(...revenueStreams.map(s => s.sort_order), 0);
      const { data, error } = await supabase
        .from("revenue_streams")
        .insert({ event_id: eventId, name: "New Revenue Stream", price: 0, projected_volume: 0, sort_order: maxOrder + 1 })
        .select().single();
      if (error) throw error;
      setRevenueStreams(prev => [...prev, data]);
    } catch (error: any) {
      toast({ title: "Error adding revenue stream", description: error.message, variant: "destructive" });
    }
  };

  const deleteRevenueStream = async (streamId: string) => {
    try {
      const { error } = await supabase.from("revenue_streams").delete().eq("id", streamId);
      if (error) throw error;
      setRevenueStreams(prev => prev.filter(s => s.id !== streamId));
    } catch (error: any) {
      toast({ title: "Error deleting revenue stream", description: error.message, variant: "destructive" });
    }
  };

  return {
    tasks, budgetItems, revenueStreams, phaseDueDates, loading,
    updateTask, addTask, deleteTask, reorderTasks, updatePhaseDueDate,
    updateBudgetItem, addBudgetItem, deleteBudgetItem, reorderBudgetItems,
    updateRevenueStream, addRevenueStream, deleteRevenueStream,
    refetch: fetchEventData,
  };
};
