import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ItinerarySession {
  id: string;
  event_id: string;
  day_number: number;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useItinerary = (eventId: string) => {
  const [sessions, setSessions] = useState<ItinerarySession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("itinerary_sessions")
        .select("*")
        .eq("event_id", eventId)
        .order("day_number")
        .order("start_time")
        .order("sort_order");

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching itinerary",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const addSession = async (dayNumber: number, sessionData: Partial<ItinerarySession>) => {
    try {
      const maxOrder = Math.max(
        ...sessions.filter(s => s.day_number === dayNumber).map(s => s.sort_order),
        0
      );

      const { data, error } = await supabase
        .from("itinerary_sessions")
        .insert({
          event_id: eventId,
          day_number: dayNumber,
          title: sessionData.title || "New Session",
          description: sessionData.description || null,
          location: sessionData.location || null,
          start_time: sessionData.start_time || "09:00",
          end_time: sessionData.end_time || "10:00",
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      setSessions(prev => [...prev, data]);
      return data;
    } catch (error: any) {
      toast({
        title: "Error adding session",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<ItinerarySession>) => {
    try {
      const { error } = await supabase
        .from("itinerary_sessions")
        .update(updates)
        .eq("id", sessionId);

      if (error) throw error;
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
    } catch (error: any) {
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("itinerary_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error: any) {
      toast({
        title: "Error deleting session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Get unique days
  const days = [...new Set(sessions.map(s => s.day_number))].sort((a, b) => a - b);

  // Add a new day
  const addDay = () => {
    const nextDay = days.length > 0 ? Math.max(...days) + 1 : 1;
    return nextDay;
  };

  return {
    sessions,
    loading,
    days,
    addSession,
    updateSession,
    deleteSession,
    addDay,
    refetch: fetchSessions,
  };
};
