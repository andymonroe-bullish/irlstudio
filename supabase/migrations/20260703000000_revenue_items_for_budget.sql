-- Revenue tracking for the Budget tab.
-- The live database already had a pre-provisioned revenue_items table
-- (category/description/projected_amount/actual_amount/received/notes),
-- so this follows the same approach used for budget_items: add the columns
-- the app needs and give the legacy NOT NULL columns defaults.

CREATE TABLE IF NOT EXISTS public.revenue_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL DEFAULT '',
  projected_amount numeric NOT NULL DEFAULT 0,
  actual_amount numeric,
  received boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.revenue_items ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Revenue';
ALTER TABLE public.revenue_items ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.revenue_items ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.revenue_items ALTER COLUMN category SET DEFAULT 'other';
ALTER TABLE public.revenue_items ALTER COLUMN description SET DEFAULT '';

ALTER TABLE public.revenue_items ENABLE ROW LEVEL SECURITY;

-- Same policy pattern as budget_items: any authenticated user can read/update/
-- delete, inserts must set created_by = auth.uid().
DROP POLICY IF EXISTS "revenue_items_select" ON public.revenue_items;
CREATE POLICY "revenue_items_select" ON public.revenue_items FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "revenue_items_insert" ON public.revenue_items;
CREATE POLICY "revenue_items_insert" ON public.revenue_items FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "revenue_items_update" ON public.revenue_items;
CREATE POLICY "revenue_items_update" ON public.revenue_items FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "revenue_items_delete" ON public.revenue_items;
CREATE POLICY "revenue_items_delete" ON public.revenue_items FOR DELETE
  USING (auth.role() = 'authenticated');
