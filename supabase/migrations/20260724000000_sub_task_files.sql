-- Attachments on sub-tasks
CREATE TABLE IF NOT EXISTS public.sub_task_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_task_id uuid NOT NULL REFERENCES public.sub_tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sub_task_files_sub_task_id_idx
  ON public.sub_task_files (sub_task_id);

ALTER TABLE public.sub_task_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sub_task_files_select ON public.sub_task_files;
DROP POLICY IF EXISTS sub_task_files_insert ON public.sub_task_files;
DROP POLICY IF EXISTS sub_task_files_delete ON public.sub_task_files;

CREATE POLICY sub_task_files_select ON public.sub_task_files
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY sub_task_files_insert ON public.sub_task_files
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY sub_task_files_delete ON public.sub_task_files
  FOR DELETE USING (auth.role() = 'authenticated');

-- The app has always uploaded task files to a "task-files" bucket, but the
-- bucket was never created. Create it (public, so files open in a new tab
-- via public URL) with the same policy shape as event-files.
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-files', 'task-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS task_files_storage_select ON storage.objects;
DROP POLICY IF EXISTS task_files_storage_insert ON storage.objects;
DROP POLICY IF EXISTS task_files_storage_delete ON storage.objects;

CREATE POLICY task_files_storage_select ON storage.objects
  FOR SELECT USING (bucket_id = 'task-files' AND auth.role() = 'authenticated');
CREATE POLICY task_files_storage_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'task-files' AND auth.role() = 'authenticated');
CREATE POLICY task_files_storage_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'task-files' AND auth.role() = 'authenticated');

-- Deleting a profile used to CASCADE-delete every task that user created,
-- which in turn cascaded away sub_tasks, task_files, and comments. Tasks
-- must outlive their creator's account.
ALTER TABLE public.tasks ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
