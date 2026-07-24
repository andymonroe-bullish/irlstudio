import { useState, useEffect, useCallback, useRef } from "react";
import { Paperclip, Trash2, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SubTaskFile {
  id: string;
  sub_task_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

interface SubTaskAttachmentsProps {
  subTaskId: string;
}

const SubTaskAttachments = ({ subTaskId }: SubTaskAttachmentsProps) => {
  const [files, setFiles] = useState<SubTaskFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchFiles = useCallback(async () => {
    const { data, error } = await supabase
      .from("sub_task_files")
      .select("*")
      .eq("sub_task_id", subTaskId)
      .order("created_at");

    if (error) {
      toast({
        title: "Error loading attachments",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setFiles(data || []);
    }
  }, [subTaskId, toast]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const getFileUrl = (filePath: string) =>
    supabase.storage.from("task-files").getPublicUrl(filePath).data.publicUrl;

  const handleUpload = async (fileList: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const filePath = `subtasks/${subTaskId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("task-files")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data, error } = await supabase
          .from("sub_task_files")
          .insert({
            sub_task_id: subTaskId,
            file_name: file.name,
            file_url: filePath,
            file_size: file.size,
            file_type: file.type,
          })
          .select()
          .single();
        if (error) throw error;

        setFiles((prev) => [...prev, data]);
      }
      toast({
        title: "Attachment uploaded",
        description: `${fileList.length} file${fileList.length === 1 ? "" : "s"} attached.`,
      });
    } catch (error: any) {
      toast({
        title: "Error uploading attachment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: SubTaskFile) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("task-files")
        .remove([file.file_url]);
      if (storageError) throw storageError;

      const { error } = await supabase
        .from("sub_task_files")
        .delete()
        .eq("id", file.id);
      if (error) throw error;

      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (error: any) {
      toast({
        title: "Error deleting attachment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center">
      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleUpload(e.target.files);
          e.target.value = "";
        }}
      />

      {files.length === 0 ? (
        <button
          onClick={openFilePicker}
          disabled={uploading}
          title="Attach files"
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Paperclip className="w-3.5 h-3.5" />
          )}
        </button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title={`${files.length} attachment${files.length === 1 ? "" : "s"}`}
              className={cn(
                "flex items-center gap-0.5 px-1 py-0.5 rounded text-xs transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Paperclip className="w-3.5 h-3.5" />
              )}
              {files.length}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Attachments
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {files.map((file) => (
              <DropdownMenuItem key={file.id} asChild className="gap-2 group/file">
                <a
                  href={getFileUrl(file.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="flex-1 truncate text-sm">{file.file_name}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(file);
                    }}
                    className="opacity-0 group-hover/file:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </a>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openFilePicker} className="gap-2 text-primary">
              <Upload className="w-3.5 h-3.5" />
              Attach files…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default SubTaskAttachments;
