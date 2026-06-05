import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface NoteFolder {
  id: string;
  event_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Note {
  id: string;
  event_id: string;
  folder_id: string | null;
  title: string;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useNotes = (eventId: string) => {
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const [foldersRes, notesRes] = await Promise.all([
        supabase
          .from("note_folders")
          .select("*")
          .eq("event_id", eventId)
          .order("sort_order"),
        supabase
          .from("notes")
          .select("*")
          .eq("event_id", eventId)
          .order("updated_at", { ascending: false }),
      ]);
      if (foldersRes.error) throw foldersRes.error;
      if (notesRes.error) throw notesRes.error;
      setFolders(foldersRes.data || []);
      setNotes(notesRes.data || []);
    } catch (error: any) {
      toast({ title: "Error loading notes", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Folder operations
  const addFolder = async (name: string): Promise<NoteFolder | null> => {
    try {
      const maxOrder = Math.max(...folders.map(f => f.sort_order), -1);
      const { data, error } = await supabase
        .from("note_folders")
        .insert({ event_id: eventId, name, sort_order: maxOrder + 1 })
        .select()
        .single();
      if (error) throw error;
      setFolders(prev => [...prev, data]);
      return data;
    } catch (error: any) {
      toast({ title: "Error creating folder", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateFolder = async (folderId: string, name: string) => {
    try {
      const { error } = await supabase
        .from("note_folders")
        .update({ name })
        .eq("id", folderId);
      if (error) throw error;
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name } : f));
    } catch (error: any) {
      toast({ title: "Error renaming folder", description: error.message, variant: "destructive" });
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from("note_folders")
        .delete()
        .eq("id", folderId);
      if (error) throw error;
      setFolders(prev => prev.filter(f => f.id !== folderId));
      // Notes in this folder become unfiled (folder_id set to null by DB ON DELETE SET NULL)
      setNotes(prev => prev.map(n => n.folder_id === folderId ? { ...n, folder_id: null } : n));
    } catch (error: any) {
      toast({ title: "Error deleting folder", description: error.message, variant: "destructive" });
    }
  };

  // Note operations
  const addNote = async (folderId: string | null): Promise<Note | null> => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          event_id: eventId,
          folder_id: folderId,
          title: "Untitled",
          content: "",
          sort_order: 0,
        })
        .select()
        .single();
      if (error) throw error;
      setNotes(prev => [data, ...prev]);
      return data;
    } catch (error: any) {
      toast({ title: "Error creating note", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Pick<Note, "title" | "content" | "folder_id">>) => {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", noteId);
      if (error) throw error;
      setNotes(prev =>
        prev.map(n => n.id === noteId ? { ...n, ...updates, updated_at: new Date().toISOString() } : n)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      );
    } catch (error: any) {
      // Silently fail on auto-save — don't toast on every keystroke save
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);
      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error: any) {
      toast({ title: "Error deleting note", description: error.message, variant: "destructive" });
    }
  };

  return {
    folders,
    notes,
    loading,
    addFolder,
    updateFolder,
    deleteFolder,
    addNote,
    updateNote,
    deleteNote,
  };
};
