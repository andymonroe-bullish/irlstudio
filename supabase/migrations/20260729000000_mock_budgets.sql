-- Mock budgets (scenarios): lets users draft alternate budget breakdowns
-- without touching the live budget. Mirrors budget_items/revenue_items RLS.

CREATE TABLE IF NOT EXISTS public.budget_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'New Scenario',
  created_by uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scenario_budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.budget_scenarios(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Expense',
  category text NOT NULL DEFAULT 'other',
  estimated_cost numeric NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scenario_revenue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.budget_scenarios(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Revenue',
  amount numeric NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_revenue_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS budget_scenarios_select ON public.budget_scenarios;
DROP POLICY IF EXISTS budget_scenarios_insert ON public.budget_scenarios;
DROP POLICY IF EXISTS budget_scenarios_update ON public.budget_scenarios;
DROP POLICY IF EXISTS budget_scenarios_delete ON public.budget_scenarios;
CREATE POLICY budget_scenarios_select ON public.budget_scenarios
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY budget_scenarios_insert ON public.budget_scenarios
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY budget_scenarios_update ON public.budget_scenarios
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY budget_scenarios_delete ON public.budget_scenarios
  FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS scenario_budget_items_select ON public.scenario_budget_items;
DROP POLICY IF EXISTS scenario_budget_items_insert ON public.scenario_budget_items;
DROP POLICY IF EXISTS scenario_budget_items_update ON public.scenario_budget_items;
DROP POLICY IF EXISTS scenario_budget_items_delete ON public.scenario_budget_items;
CREATE POLICY scenario_budget_items_select ON public.scenario_budget_items
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY scenario_budget_items_insert ON public.scenario_budget_items
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY scenario_budget_items_update ON public.scenario_budget_items
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY scenario_budget_items_delete ON public.scenario_budget_items
  FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS scenario_revenue_items_select ON public.scenario_revenue_items;
DROP POLICY IF EXISTS scenario_revenue_items_insert ON public.scenario_revenue_items;
DROP POLICY IF EXISTS scenario_revenue_items_update ON public.scenario_revenue_items;
DROP POLICY IF EXISTS scenario_revenue_items_delete ON public.scenario_revenue_items;
CREATE POLICY scenario_revenue_items_select ON public.scenario_revenue_items
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY scenario_revenue_items_insert ON public.scenario_revenue_items
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY scenario_revenue_items_update ON public.scenario_revenue_items
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY scenario_revenue_items_delete ON public.scenario_revenue_items
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_budget_scenarios_event ON public.budget_scenarios(event_id);
CREATE INDEX IF NOT EXISTS idx_scenario_budget_items_scenario ON public.scenario_budget_items(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_revenue_items_scenario ON public.scenario_revenue_items(scenario_id);
