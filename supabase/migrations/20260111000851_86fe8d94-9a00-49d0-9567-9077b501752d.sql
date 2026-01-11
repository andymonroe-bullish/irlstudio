-- Create itinerary_sessions table
CREATE TABLE public.itinerary_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.itinerary_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using the existing user_has_event_access function
CREATE POLICY "Users can view itinerary sessions for their events"
ON public.itinerary_sessions
FOR SELECT
USING (public.user_has_event_access(event_id));

CREATE POLICY "Users can create itinerary sessions for their events"
ON public.itinerary_sessions
FOR INSERT
WITH CHECK (public.user_has_event_access(event_id));

CREATE POLICY "Users can update itinerary sessions for their events"
ON public.itinerary_sessions
FOR UPDATE
USING (public.user_has_event_access(event_id));

CREATE POLICY "Users can delete itinerary sessions for their events"
ON public.itinerary_sessions
FOR DELETE
USING (public.user_has_event_access(event_id));

-- Create trigger for updated_at
CREATE TRIGGER update_itinerary_sessions_updated_at
BEFORE UPDATE ON public.itinerary_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_itinerary_sessions_event_id ON public.itinerary_sessions(event_id);
CREATE INDEX idx_itinerary_sessions_day ON public.itinerary_sessions(event_id, day_number);