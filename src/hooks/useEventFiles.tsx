import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface EventFile {
  id: string;
  event_id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  category: string;
  created_by: string | null;
  created_at: string;
}

export interface EventLink {
  id: string;
  event_id: string;
  title: string;
  url: string;
  link_type: string;
  created_by: string | null;
  created_at: string;
}

export const useEventFiles = (eventId: string) => {
  const [files, setFiles] = useState<EventFile[]>([]);
  const [links, setLinks] = useState<EventLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const [filesRes, linksRes] = await Promise.all([
        supabase.from("event_files").select("*").eq("event_id", eventId).order("created_at", { ascending: false }),
        supabase.from("event_links").select("*").eq("event_id", eventId).order("created_at", { ascending: false }),
      ]);
      if (filesRes.error) throw filesRes.error;
      if (linksRes.error) throw linksRes.error;
      setFiles(filesRes.data || []);
      setLinks(linksRes.data || []);
    } catch (error: any) {
      toast({ title: "Error loading files", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const uploadFile = async (file: File, category: string = "other"): Promise<EventFile | null> => {
    if (!user) return null;
    try {
      setUploading(true);
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${eventId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("event-files")
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("event_files")
        .insert({
          event_id: eventId,
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          category,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      setFiles(prev => [data, ...prev]);
      toast({ title: "File uploaded", description: `${file.name} uploaded successfully.` });
      return data;
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    try {
      await supabase.storage.from("event-files").remove([filePath]);
      const { error } = await supabase.from("event_files").delete().eq("id", fileId);
      if (error) throw error;
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast({ title: "File deleted" });
    } catch (error: any) {
      toast({ title: "Error deleting file", description: error.message, variant: "destructive" });
    }
  };

  const getFileUrl = (filePath: string): string => {
    const { data } = supabase.storage.from("event-files").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const renameFile = async (fileId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      const { error } = await supabase.from("event_files").update({ name: trimmed }).eq("id", fileId);
      if (error) throw error;
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: trimmed } : f));
    } catch (error: any) {
      toast({ title: "Error renaming file", description: error.message, variant: "destructive" });
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("event-files")
        .createSignedUrl(filePath, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    } catch (error: any) {
      toast({ title: "Couldn't open file", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("event-files").download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Download failed", description: error.message, variant: "destructive" });
    }
  };

  const addLink = async (title: string, url: string, linkType: string): Promise<EventLink | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("event_links")
        .insert({ event_id: eventId, title, url, link_type: linkType, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      setLinks(prev => [data, ...prev]);
      return data;
    } catch (error: any) {
      toast({ title: "Error adding link", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateLink = async (linkId: string, updates: Partial<Pick<EventLink, "title" | "url">>) => {
    try {
      const { error } = await supabase.from("event_links").update(updates).eq("id", linkId);
      if (error) throw error;
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, ...updates } : l));
    } catch (error: any) {
      toast({ title: "Error updating link", description: error.message, variant: "destructive" });
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase.from("event_links").delete().eq("id", linkId);
      if (error) throw error;
      setLinks(prev => prev.filter(l => l.id !== linkId));
    } catch (error: any) {
      toast({ title: "Error deleting link", description: error.message, variant: "destructive" });
    }
  };

  return {
    files, links, loading, uploading,
    uploadFile, deleteFile, getFileUrl, getSignedUrl, downloadFile, renameFile,
    addLink, updateLink, deleteLink,
  };
};
