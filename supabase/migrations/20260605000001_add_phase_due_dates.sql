ALTER TABLE events ADD COLUMN IF NOT EXISTS phase_due_dates jsonb DEFAULT '{}'::jsonb;
