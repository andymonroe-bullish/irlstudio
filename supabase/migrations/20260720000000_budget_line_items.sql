-- Itemized line items under each budget item (e.g. every individual
-- Audio/Visual purchase). When a budget item has line items, the app keeps
-- its actual_cost in sync with the sum of its lines.

CREATE TABLE IF NOT EXISTS public.budget_line_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_item_id uuid NOT NULL REFERENCES public.budget_items(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS budget_line_items_event_id_idx ON public.budget_line_items(event_id);
CREATE INDEX IF NOT EXISTS budget_line_items_budget_item_id_idx ON public.budget_line_items(budget_item_id);

ALTER TABLE public.budget_line_items ENABLE ROW LEVEL SECURITY;

-- Same policy pattern as budget_items / revenue_items: any authenticated user
-- can read/update/delete, inserts must set created_by = auth.uid().
DROP POLICY IF EXISTS "budget_line_items_select" ON public.budget_line_items;
CREATE POLICY "budget_line_items_select" ON public.budget_line_items FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "budget_line_items_insert" ON public.budget_line_items;
CREATE POLICY "budget_line_items_insert" ON public.budget_line_items FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "budget_line_items_update" ON public.budget_line_items;
CREATE POLICY "budget_line_items_update" ON public.budget_line_items FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "budget_line_items_delete" ON public.budget_line_items;
CREATE POLICY "budget_line_items_delete" ON public.budget_line_items FOR DELETE
  USING (auth.role() = 'authenticated');
