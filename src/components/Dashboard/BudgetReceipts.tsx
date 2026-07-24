import { useState, useEffect, useCallback, useRef } from "react";
import { Receipt, Trash2, Upload, Loader2, Download } from "lucide-react";
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

export interface BudgetReceipt {
  id: string;
  budget_item_id: string | null;
  line_item_id: string | null;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

// Attach to exactly one of a main budget item or an itemized line item
interface BudgetReceiptsProps {
  budgetItemId?: string;
  lineItemId?: string;
}

const BudgetReceipts = ({ budgetItemId, lineItemId }: BudgetReceiptsProps) => {
  const [receipts, setReceipts] = useState<BudgetReceipt[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parentColumn = budgetItemId ? "budget_item_id" : "line_item_id";
  const parentId = budgetItemId || lineItemId;

  const fetchReceipts = useCallback(async () => {
    if (!parentId) return;
    const { data, error } = await supabase
      .from("budget_receipts")
      .select("*")
      .eq(parentColumn, parentId)
      .order("created_at");

    if (error) {
      toast({
        title: "Error loading receipts",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setReceipts(data || []);
    }
  }, [parentColumn, parentId, toast]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const viewUrl = (filePath: string) =>
    supabase.storage.from("receipts").getPublicUrl(filePath).data.publicUrl;

  // ?download= makes Supabase serve the file with a content-disposition
  // attachment header, so the browser saves it instead of displaying it
  const downloadUrl = (receipt: BudgetReceipt) =>
    `${viewUrl(receipt.file_url)}?download=${encodeURIComponent(receipt.file_name)}`;

  const handleUpload = async (fileList: FileList) => {
    if (!parentId) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const filePath = `${parentColumn === "budget_item_id" ? "items" : "lines"}/${parentId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data, error } = await supabase
          .from("budget_receipts")
          .insert({
            [parentColumn]: parentId,
            file_name: file.name,
            file_url: filePath,
            file_size: file.size,
            file_type: file.type,
          })
          .select()
          .single();
        if (error) throw error;

        setReceipts((prev) => [...prev, data]);
      }
      toast({
        title: "Receipt uploaded",
        description: `${fileList.length} file${fileList.length === 1 ? "" : "s"} attached.`,
      });
    } catch (error: any) {
      toast({
        title: "Error uploading receipt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (receipt: BudgetReceipt) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("receipts")
        .remove([receipt.file_url]);
      if (storageError) throw storageError;

      const { error } = await supabase
        .from("budget_receipts")
        .delete()
        .eq("id", receipt.id);
      if (error) throw error;

      setReceipts((prev) => prev.filter((r) => r.id !== receipt.id));
    } catch (error: any) {
      toast({
        title: "Error deleting receipt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center shrink-0">
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

      {receipts.length === 0 ? (
        <button
          onClick={openFilePicker}
          disabled={uploading}
          title="Attach receipt"
          className="p-1 rounded text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Receipt className="w-3.5 h-3.5" />
          )}
        </button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title={`${receipts.length} receipt${receipts.length === 1 ? "" : "s"}`}
              className={cn(
                "flex items-center gap-0.5 px-1 py-0.5 rounded text-xs transition-colors",
                "text-primary hover:bg-muted"
              )}
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Receipt className="w-3.5 h-3.5" />
              )}
              {receipts.length}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border w-72">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Receipts — click to view
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {receipts.map((receipt) => (
              <DropdownMenuItem key={receipt.id} asChild className="gap-2 group/receipt">
                <a
                  href={viewUrl(receipt.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Receipt className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="flex-1 truncate text-sm">{receipt.file_name}</span>
                  <button
                    title="Download"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(downloadUrl(receipt), "_blank");
                    }}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(receipt);
                    }}
                    title="Delete"
                    className="opacity-0 group-hover/receipt:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </a>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openFilePicker} className="gap-2 text-primary">
              <Upload className="w-3.5 h-3.5" />
              Attach receipt…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default BudgetReceipts;
