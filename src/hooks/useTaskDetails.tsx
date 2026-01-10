import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface SubTask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
}

export interface TaskFile {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

export interface TaskLink {
  id: string;
  task_id: string;
  title: string;
  url: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useTaskDetails = (taskId: string) => {
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTaskDetails = useCallback(async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const [subTasksRes, filesRes, linksRes, commentsRes] = await Promise.all([
        supabase.from("sub_tasks").select("*").eq("task_id", taskId).order("sort_order"),
        supabase.from("task_files").select("*").eq("task_id", taskId).order("created_at", { ascending: false }),
        supabase.from("task_links").select("*").eq("task_id", taskId).order("created_at", { ascending: false }),
        supabase.from("task_comments").select("*").eq("task_id", taskId).order("created_at", { ascending: false }),
      ]);

      if (subTasksRes.error) throw subTasksRes.error;
      if (filesRes.error) throw filesRes.error;
      if (linksRes.error) throw linksRes.error;
      if (commentsRes.error) throw commentsRes.error;

      setSubTasks(subTasksRes.data || []);
      setFiles(filesRes.data || []);
      setLinks(linksRes.data || []);
      setComments(commentsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching task details",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [taskId, toast]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  // Sub-task operations
  const addSubTask = async (title: string) => {
    try {
      const maxOrder = Math.max(...subTasks.map((s) => s.sort_order), 0);
      const { data, error } = await supabase
        .from("sub_tasks")
        .insert({ task_id: taskId, title, sort_order: maxOrder + 1 })
        .select()
        .single();

      if (error) throw error;
      setSubTasks((prev) => [...prev, data]);
    } catch (error: any) {
      toast({
        title: "Error adding sub-task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateSubTask = async (subTaskId: string, updates: Partial<SubTask>) => {
    try {
      const { error } = await supabase
        .from("sub_tasks")
        .update(updates)
        .eq("id", subTaskId);

      if (error) throw error;
      setSubTasks((prev) =>
        prev.map((s) => (s.id === subTaskId ? { ...s, ...updates } : s))
      );
    } catch (error: any) {
      toast({
        title: "Error updating sub-task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSubTask = async (subTaskId: string) => {
    try {
      const { error } = await supabase.from("sub_tasks").delete().eq("id", subTaskId);
      if (error) throw error;
      setSubTasks((prev) => prev.filter((s) => s.id !== subTaskId));
    } catch (error: any) {
      toast({
        title: "Error deleting sub-task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Link operations
  const addLink = async (title: string, url: string) => {
    try {
      const { data, error } = await supabase
        .from("task_links")
        .insert({ task_id: taskId, title, url })
        .select()
        .single();

      if (error) throw error;
      setLinks((prev) => [data, ...prev]);
    } catch (error: any) {
      toast({
        title: "Error adding link",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase.from("task_links").delete().eq("id", linkId);
      if (error) throw error;
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (error: any) {
      toast({
        title: "Error deleting link",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Comment operations
  const addComment = async (content: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({ task_id: taskId, user_id: user.id, content })
        .select()
        .single();

      if (error) throw error;
      setComments((prev) => [data, ...prev]);
    } catch (error: any) {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from("task_comments").delete().eq("id", commentId);
      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error: any) {
      toast({
        title: "Error deleting comment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // File operations
  const uploadFile = async (file: File) => {
    if (!user) return;
    try {
      const filePath = `${user.id}/${taskId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("task-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("task-files")
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from("task_files")
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_url: filePath,
          file_size: file.size,
          file_type: file.type,
        })
        .select()
        .single();

      if (error) throw error;
      setFiles((prev) => [data, ...prev]);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error uploading file",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("task-files")
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error } = await supabase.from("task_files").delete().eq("id", fileId);
      if (error) throw error;
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error: any) {
      toast({
        title: "Error deleting file",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from("task-files").getPublicUrl(filePath);
    return data.publicUrl;
  };

  return {
    subTasks,
    files,
    links,
    comments,
    loading,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    addLink,
    deleteLink,
    addComment,
    deleteComment,
    uploadFile,
    deleteFile,
    getFileUrl,
    refetch: fetchTaskDetails,
  };
};
