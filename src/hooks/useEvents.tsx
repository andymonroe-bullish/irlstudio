import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { getInitialPhases, getInitialBudgetItems } from "@/components/Dashboard/types";

export interface Event {
  id: string;
  user_id: string;
  event_type: string;
  name: string | null;
  budget: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

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
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
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
      
      const { data: newEvent, error: eventError } = await supabase
        .from("events")
        .insert({
          user_id: user.id,
          event_type: eventData.eventType,
          budget: budgetNumber,
          start_date: eventData.dateRange.from?.toISOString().split("T")[0],
          end_date: eventData.dateRange.to?.toISOString().split("T")[0] || null,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create initial tasks from phases
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
        }))
      );

      const { error: tasksError } = await supabase
        .from("tasks")
        .insert(tasksToInsert);

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
      }));

      const { error: budgetError } = await supabase
        .from("budget_items")
        .insert(budgetItemsToInsert);

      if (budgetError) throw budgetError;

      // Create initial revenue streams
      const initialRevenueStreams = [
        { name: "Core Mastermind Seat", price: 1600, projected_volume: 15 },
        { name: "Premium Mastermind Pass", price: 2200, projected_volume: 10 },
        { name: "Exclusive Partner Sponsorship", price: 4000, projected_volume: 1 },
        { name: "Post-Mastermind Group Coaching", price: 750, projected_volume: 5 },
      ];

      const revenueStreamsToInsert = initialRevenueStreams.map((stream, index) => ({
        event_id: newEvent.id,
        name: stream.name,
        price: stream.price,
        projected_volume: stream.projected_volume,
        sort_order: index,
      }));

      const { error: revenueError } = await supabase
        .from("revenue_streams")
        .insert(revenueStreamsToInsert);

      if (revenueError) throw revenueError;

      await fetchEvents();
      
      toast({
        title: "Event created!",
        description: "Your event has been created successfully.",
      });

      return newEvent;
    } catch (error: any) {
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
      
      await fetchEvents();
      
      toast({
        title: "Event deleted",
        description: "Your event has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting event",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateEventName = async (eventId: string, name: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ name })
        .eq("id", eventId);

      if (error) throw error;
      
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, name } : e));
      
      toast({
        title: "Event renamed",
        description: "Your event has been renamed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error renaming event",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    events,
    loading,
    createEvent,
    deleteEvent,
    updateEventName,
    refetch: fetchEvents,
  };
};

export const useEventData = (eventId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEventData = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const [tasksRes, budgetRes, revenueRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("event_id", eventId).order("sort_order"),
        supabase.from("budget_items").select("*").eq("event_id", eventId).order("sort_order"),
        supabase.from("revenue_streams").select("*").eq("event_id", eventId).order("sort_order"),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (budgetRes.error) throw budgetRes.error;
      if (revenueRes.error) throw revenueRes.error;

      setTasks(tasksRes.data || []);
      setBudgetItems(budgetRes.data || []);
      setRevenueStreams(revenueRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching event data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  // Task operations
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addTask = async (phaseId: string, title: string) => {
    try {
      const maxOrder = Math.max(...tasks.filter(t => t.phase_id === phaseId).map(t => t.sort_order), 0);
      
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          event_id: eventId,
          phase_id: phaseId,
          title,
          status: "not_started",
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [...prev, data]);
    } catch (error: any) {
      toast({
        title: "Error adding task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error: any) {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const reorderTasks = async (reorderedTasks: Task[]) => {
    setTasks(reorderedTasks);
    
    try {
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        event_id: task.event_id,
        phase_id: task.phase_id,
        title: task.title,
        status: task.status,
        assignee: task.assignee,
        due_date: task.due_date,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("tasks")
          .update({ sort_order: update.sort_order, phase_id: update.phase_id })
          .eq("id", update.id);
      }
    } catch (error: any) {
      toast({
        title: "Error reordering tasks",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Budget operations
  const updateBudgetItem = async (itemId: string, updates: Partial<BudgetItem>) => {
    try {
      const { error } = await supabase
        .from("budget_items")
        .update(updates)
        .eq("id", itemId);

      if (error) throw error;
      
      setBudgetItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
    } catch (error: any) {
      toast({
        title: "Error updating budget item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addBudgetItem = async (item: Omit<BudgetItem, "id" | "event_id" | "sort_order">) => {
    try {
      const maxOrder = Math.max(...budgetItems.map(i => i.sort_order), 0);
      
      const { data, error } = await supabase
        .from("budget_items")
        .insert({
          event_id: eventId,
          ...item,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      
      setBudgetItems(prev => [...prev, data]);
    } catch (error: any) {
      toast({
        title: "Error adding budget item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteBudgetItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("budget_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      
      setBudgetItems(prev => prev.filter(i => i.id !== itemId));
    } catch (error: any) {
      toast({
        title: "Error deleting budget item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const reorderBudgetItems = async (reorderedItems: BudgetItem[]) => {
    setBudgetItems(reorderedItems);
    
    try {
      for (let i = 0; i < reorderedItems.length; i++) {
        await supabase
          .from("budget_items")
          .update({ sort_order: i })
          .eq("id", reorderedItems[i].id);
      }
    } catch (error: any) {
      toast({
        title: "Error reordering budget items",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Revenue stream operations
  const updateRevenueStream = async (streamId: string, updates: Partial<RevenueStream>) => {
    try {
      const { error } = await supabase
        .from("revenue_streams")
        .update(updates)
        .eq("id", streamId);

      if (error) throw error;
      
      setRevenueStreams(prev => prev.map(s => s.id === streamId ? { ...s, ...updates } : s));
    } catch (error: any) {
      toast({
        title: "Error updating revenue stream",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addRevenueStream = async () => {
    try {
      const maxOrder = Math.max(...revenueStreams.map(s => s.sort_order), 0);
      
      const { data, error } = await supabase
        .from("revenue_streams")
        .insert({
          event_id: eventId,
          name: "New Revenue Stream",
          price: 0,
          projected_volume: 0,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      
      setRevenueStreams(prev => [...prev, data]);
    } catch (error: any) {
      toast({
        title: "Error adding revenue stream",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteRevenueStream = async (streamId: string) => {
    try {
      const { error } = await supabase
        .from("revenue_streams")
        .delete()
        .eq("id", streamId);

      if (error) throw error;
      
      setRevenueStreams(prev => prev.filter(s => s.id !== streamId));
    } catch (error: any) {
      toast({
        title: "Error deleting revenue stream",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    tasks,
    budgetItems,
    revenueStreams,
    loading,
    updateTask,
    addTask,
    deleteTask,
    reorderTasks,
    updateBudgetItem,
    addBudgetItem,
    deleteBudgetItem,
    reorderBudgetItems,
    updateRevenueStream,
    addRevenueStream,
    deleteRevenueStream,
    refetch: fetchEventData,
  };
};