-- Note folders
CREATE TABLE note_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Folder',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own note folders"
  ON note_folders
  USING (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
      UNION
      SELECT ec.event_id FROM event_collaborators ec WHERE ec.user_id = auth.uid()
    )
  );

-- Notes
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES note_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes"
  ON notes
  USING (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
      UNION
      SELECT ec.event_id FROM event_collaborators ec WHERE ec.user_id = auth.uid()
    )
  );
