-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  budget INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS policies for events
CREATE POLICY "Users can view their own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON public.events FOR DELETE USING (auth.uid() = user_id);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  phase_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  assignee TEXT,
  due_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks (via event ownership)
CREATE POLICY "Users can view tasks for their events" ON public.tasks FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.user_id = auth.uid()));
CREATE POLICY "Users can create tasks for their events" ON public.tasks FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.user_id = auth.uid()));
CREATE POLICY "Users can update tasks for their events" ON public.tasks FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.user_id = auth.uid()));
CREATE POLICY "Users can delete tasks for their events" ON public.tasks FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.user_id = auth.uid()));

-- Create budget_items table
CREATE TABLE public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  estimated_cost INTEGER NOT NULL DEFAULT 0,
  actual_cost INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'planned',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for budget_items
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for budget_items
CREATE POLICY "Users can view budget_items for their events" ON public.budget_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.user_id = auth.uid()));
CREATE POLICY "Users can create budget_items for their events" ON public.budget_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.user_id = auth.uid()));
CREATE POLICY "Users can update budget_items for their events" ON public.budget_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.user_id = auth.uid()));
CREATE POLICY "Users can delete budget_items for their events" ON public.budget_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.user_id = auth.uid()));

-- Create revenue_streams table
CREATE TABLE public.revenue_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  projected_volume INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for revenue_streams
ALTER TABLE public.revenue_streams ENABLE ROW LEVEL SECURITY;

-- RLS policies for revenue_streams
CREATE POLICY "Users can view revenue_streams for their events" ON public.revenue_streams FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = revenue_streams.event_id AND events.user_id = auth.uid()));
CREATE POLICY "Users can create revenue_streams for their events" ON public.revenue_streams FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = revenue_streams.event_id AND events.user_id = auth.uid()));
CREATE POLICY "Users can update revenue_streams for their events" ON public.revenue_streams FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = revenue_streams.event_id AND events.user_id = auth.uid()));
CREATE POLICY "Users can delete revenue_streams for their events" ON public.revenue_streams FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = revenue_streams.event_id AND events.user_id = auth.uid()));

-- Create trigger for updating timestamps on all tables
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON public.budget_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_revenue_streams_updated_at BEFORE UPDATE ON public.revenue_streams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();