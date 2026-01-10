-- Add name column to events table
ALTER TABLE public.events ADD COLUMN name TEXT;

-- Create sub_tasks table
CREATE TABLE public.sub_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sub_tasks
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sub_tasks (through task ownership)
CREATE POLICY "Users can view sub_tasks of their tasks"
  ON public.sub_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = sub_tasks.task_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sub_tasks for their tasks"
  ON public.sub_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = sub_tasks.task_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sub_tasks of their tasks"
  ON public.sub_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = sub_tasks.task_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sub_tasks of their tasks"
  ON public.sub_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = sub_tasks.task_id AND e.user_id = auth.uid()
    )
  );

-- Create task_files table
CREATE TABLE public.task_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on task_files
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_files
CREATE POLICY "Users can view files of their tasks"
  ON public.task_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = task_files.task_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create files for their tasks"
  ON public.task_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = task_files.task_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files of their tasks"
  ON public.task_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = task_files.task_id AND e.user_id = auth.uid()
    )
  );

-- Create task_links table
CREATE TABLE public.task_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on task_links
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_links
CREATE POLICY "Users can view links of their tasks"
  ON public.task_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = task_links.task_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create links for their tasks"
  ON public.task_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = task_links.task_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update links of their tasks"
  ON public.task_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = task_links.task_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete links of their tasks"
  ON public.task_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = task_links.task_id AND e.user_id = auth.uid()
    )
  );

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on task_comments
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_comments
CREATE POLICY "Users can view comments of their tasks"
  ON public.task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = task_comments.task_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments for their tasks"
  ON public.task_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = task_comments.task_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.task_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete comments of their tasks"
  ON public.task_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.events e ON t.event_id = e.id
      WHERE t.id = task_comments.task_id AND e.user_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_sub_tasks_updated_at
  BEFORE UPDATE ON public.sub_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for task files
INSERT INTO storage.buckets (id, name, public) VALUES ('task-files', 'task-files', false);

-- Create storage policies for task files
CREATE POLICY "Users can view their task files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their task files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their task files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);