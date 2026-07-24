-- Meeting notes & transcripts ingested from Circleback (or other tools) via
-- webhook, browsed in the admin portal, and consumed by the Hermes agent
-- through the v1 API.
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'circleback',
  external_id text,
  title text NOT NULL DEFAULT 'Untitled meeting',
  meeting_date timestamptz,
  attendees jsonb,
  summary text,
  notes jsonb,
  action_items jsonb,
  transcript text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Re-delivered webhooks update the existing row instead of duplicating it
CREATE UNIQUE INDEX IF NOT EXISTS meetings_source_external_id_idx
  ON public.meetings (source, external_id)
  WHERE external_id IS NOT NULL;

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Only the admin allowlist may see or manage meetings from the app.
-- Inserts happen exclusively through the webhook (service role), so there is
-- deliberately no INSERT policy.
DROP POLICY IF EXISTS meetings_select ON public.meetings;
DROP POLICY IF EXISTS meetings_update ON public.meetings;
DROP POLICY IF EXISTS meetings_delete ON public.meetings;

CREATE POLICY meetings_select ON public.meetings
  FOR SELECT USING (
    (auth.jwt() ->> 'email') IN ('andy@bullishevents.com', 'ethan@bullishevents.com')
  );
CREATE POLICY meetings_update ON public.meetings
  FOR UPDATE USING (
    (auth.jwt() ->> 'email') IN ('andy@bullishevents.com', 'ethan@bullishevents.com')
  );
CREATE POLICY meetings_delete ON public.meetings
  FOR DELETE USING (
    (auth.jwt() ->> 'email') IN ('andy@bullishevents.com', 'ethan@bullishevents.com')
  );
