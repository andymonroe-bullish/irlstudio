import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface BudgetScenario {
  id: string;
  event_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface ScenarioBudgetItem {
  id: string;
  scenario_id: string;
  event_id: string;
  name: string;
  category: string;
  estimated_cost: number;
  sort_order: number;
}

export interface ScenarioRevenueItem {
  id: string;
  scenario_id: string;
  event_id: string;
  name: string;
  amount: number;
  sort_order: number;
}

// The generated Database types predate these tables, so query them untyped.
const db = supabase as any;

export const useBudgetScenarios = (eventId: string) => {
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [scenarioItems, setScenarioItems] = useState<ScenarioBudgetItem[]>([]);
  const [scenarioRevenues, setScenarioRevenues] = useState<ScenarioRevenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchScenarios = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const [scenariosRes, itemsRes, revenuesRes] = await Promise.all([
        db.from("budget_scenarios").select("*").eq("event_id", eventId).order("sort_order"),
        db.from("scenario_budget_items").select("*").eq("event_id", eventId).order("sort_order"),
        db.from("scenario_revenue_items").select("*").eq("event_id", eventId).order("sort_order"),
      ]);
      if (scenariosRes.error) throw scenariosRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (revenuesRes.error) throw revenuesRes.error;
      setScenarios(scenariosRes.data || []);
      setScenarioItems(itemsRes.data || []);
      setScenarioRevenues(revenuesRes.data || []);
    } catch (error: any) {
      toast({ title: "Error loading mock budgets", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => { fetchScenarios(); }, [fetchScenarios]);

  const createScenario = async (
    name: string,
    seed?: {
      items: { name: string; category: string; estimated_cost: number }[];
      revenues: { name: string; amount: number }[];
    }
  ): Promise<BudgetScenario | null> => {
    if (!user) return null;
    try {
      const maxOrder = Math.max(...scenarios.map(s => s.sort_order), 0);
      const { data: scenario, error } = await db
        .from("budget_scenarios")
        // created_by is required by the INSERT row-level-security policy
        // (auth.uid() = created_by), so it must be set explicitly.
        .insert({ event_id: eventId, name, created_by: user.id, sort_order: maxOrder + 1 })
        .select().single();
      if (error) throw error;

      let newItems: ScenarioBudgetItem[] = [];
      let newRevenues: ScenarioRevenueItem[] = [];
      if (seed && seed.items.length > 0) {
        const { data, error: itemsError } = await db
          .from("scenario_budget_items")
          .insert(seed.items.map((item, i) => ({
            scenario_id: scenario.id,
            event_id: eventId,
            ...item,
            created_by: user.id,
            sort_order: i,
          })))
          .select();
        if (itemsError) throw itemsError;
        newItems = data || [];
      }
      if (seed && seed.revenues.length > 0) {
        const { data, error: revenuesError } = await db
          .from("scenario_revenue_items")
          .insert(seed.revenues.map((item, i) => ({
            scenario_id: scenario.id,
            event_id: eventId,
            ...item,
            created_by: user.id,
            sort_order: i,
          })))
          .select();
        if (revenuesError) throw revenuesError;
        newRevenues = data || [];
      }

      setScenarios(prev => [...prev, scenario]);
      setScenarioItems(prev => [...prev, ...newItems]);
      setScenarioRevenues(prev => [...prev, ...newRevenues]);
      return scenario;
    } catch (error: any) {
      toast({ title: "Error creating mock budget", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const renameScenario = async (scenarioId: string, name: string) => {
    try {
      const { error } = await db.from("budget_scenarios").update({ name }).eq("id", scenarioId);
      if (error) throw error;
      setScenarios(prev => prev.map(s => s.id === scenarioId ? { ...s, name } : s));
    } catch (error: any) {
      toast({ title: "Error renaming mock budget", description: error.message, variant: "destructive" });
    }
  };

  const deleteScenario = async (scenarioId: string) => {
    try {
      const { error } = await db.from("budget_scenarios").delete().eq("id", scenarioId);
      if (error) throw error;
      // Items and revenues cascade-delete in the DB; mirror that locally
      setScenarios(prev => prev.filter(s => s.id !== scenarioId));
      setScenarioItems(prev => prev.filter(i => i.scenario_id !== scenarioId));
      setScenarioRevenues(prev => prev.filter(r => r.scenario_id !== scenarioId));
    } catch (error: any) {
      toast({ title: "Error deleting mock budget", description: error.message, variant: "destructive" });
    }
  };

  const duplicateScenario = async (scenarioId: string): Promise<BudgetScenario | null> => {
    const source = scenarios.find(s => s.id === scenarioId);
    if (!source) return null;
    return createScenario(`${source.name} (Copy)`, {
      items: scenarioItems
        .filter(i => i.scenario_id === scenarioId)
        .map(i => ({ name: i.name, category: i.category, estimated_cost: i.estimated_cost })),
      revenues: scenarioRevenues
        .filter(r => r.scenario_id === scenarioId)
        .map(r => ({ name: r.name, amount: r.amount })),
    });
  };

  const addScenarioItem = async (
    scenarioId: string,
    item: { name: string; category: string; estimated_cost: number }
  ) => {
    if (!user) return;
    try {
      const maxOrder = Math.max(
        ...scenarioItems.filter(i => i.scenario_id === scenarioId).map(i => i.sort_order),
        0
      );
      const { data, error } = await db
        .from("scenario_budget_items")
        .insert({ scenario_id: scenarioId, event_id: eventId, ...item, created_by: user.id, sort_order: maxOrder + 1 })
        .select().single();
      if (error) throw error;
      setScenarioItems(prev => [...prev, data]);
    } catch (error: any) {
      toast({ title: "Error adding expense", description: error.message, variant: "destructive" });
    }
  };

  const updateScenarioItem = async (itemId: string, updates: Partial<ScenarioBudgetItem>) => {
    try {
      const { error } = await db.from("scenario_budget_items").update(updates).eq("id", itemId);
      if (error) throw error;
      setScenarioItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
    } catch (error: any) {
      toast({ title: "Error updating expense", description: error.message, variant: "destructive" });
    }
  };

  const deleteScenarioItem = async (itemId: string) => {
    try {
      const { error } = await db.from("scenario_budget_items").delete().eq("id", itemId);
      if (error) throw error;
      setScenarioItems(prev => prev.filter(i => i.id !== itemId));
    } catch (error: any) {
      toast({ title: "Error deleting expense", description: error.message, variant: "destructive" });
    }
  };

  const addScenarioRevenue = async (scenarioId: string, item: { name: string; amount: number }) => {
    if (!user) return;
    try {
      const maxOrder = Math.max(
        ...scenarioRevenues.filter(r => r.scenario_id === scenarioId).map(r => r.sort_order),
        0
      );
      const { data, error } = await db
        .from("scenario_revenue_items")
        .insert({ scenario_id: scenarioId, event_id: eventId, ...item, created_by: user.id, sort_order: maxOrder + 1 })
        .select().single();
      if (error) throw error;
      setScenarioRevenues(prev => [...prev, data]);
    } catch (error: any) {
      toast({ title: "Error adding revenue", description: error.message, variant: "destructive" });
    }
  };

  const updateScenarioRevenue = async (itemId: string, updates: Partial<ScenarioRevenueItem>) => {
    try {
      const { error } = await db.from("scenario_revenue_items").update(updates).eq("id", itemId);
      if (error) throw error;
      setScenarioRevenues(prev => prev.map(r => r.id === itemId ? { ...r, ...updates } : r));
    } catch (error: any) {
      toast({ title: "Error updating revenue", description: error.message, variant: "destructive" });
    }
  };

  const deleteScenarioRevenue = async (itemId: string) => {
    try {
      const { error } = await db.from("scenario_revenue_items").delete().eq("id", itemId);
      if (error) throw error;
      setScenarioRevenues(prev => prev.filter(r => r.id !== itemId));
    } catch (error: any) {
      toast({ title: "Error deleting revenue", description: error.message, variant: "destructive" });
    }
  };

  return {
    scenarios, scenarioItems, scenarioRevenues, loading,
    createScenario, renameScenario, deleteScenario, duplicateScenario,
    addScenarioItem, updateScenarioItem, deleteScenarioItem,
    addScenarioRevenue, updateScenarioRevenue, deleteScenarioRevenue,
    refetch: fetchScenarios,
  };
};
