-- Receipts attached to budget expenses: either a main budget item or one of
-- its itemized line items (exactly one of the two).
CREATE TABLE IF NOT EXISTS public.budget_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id uuid REFERENCES public.budget_items(id) ON DELETE CASCADE,
  line_item_id uuid REFERENCES public.budget_line_items(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((budget_item_id IS NULL) <> (line_item_id IS NULL))
);

CREATE INDEX IF NOT EXISTS budget_receipts_budget_item_id_idx
  ON public.budget_receipts (budget_item_id);
CREATE INDEX IF NOT EXISTS budget_receipts_line_item_id_idx
  ON public.budget_receipts (line_item_id);

ALTER TABLE public.budget_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS budget_receipts_select ON public.budget_receipts;
DROP POLICY IF EXISTS budget_receipts_insert ON public.budget_receipts;
DROP POLICY IF EXISTS budget_receipts_delete ON public.budget_receipts;

CREATE POLICY budget_receipts_select ON public.budget_receipts
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY budget_receipts_insert ON public.budget_receipts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY budget_receipts_delete ON public.budget_receipts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Public bucket so receipts open directly in a new tab; uploads/deletes
-- require an authenticated session (same shape as task-files).
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS receipts_storage_select ON storage.objects;
DROP POLICY IF EXISTS receipts_storage_insert ON storage.objects;
DROP POLICY IF EXISTS receipts_storage_delete ON storage.objects;

CREATE POLICY receipts_storage_select ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');
CREATE POLICY receipts_storage_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
CREATE POLICY receipts_storage_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');
