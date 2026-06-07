import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Trash2, Download, ExternalLink, Plus, Link,
  FileText, FileImage, FileSpreadsheet, Presentation, File,
  X, Check,
} from "lucide-react";
import { useEventFiles } from "@/hooks/useEventFiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface FilesManagerProps {
  eventId: string;
}

const FILE_CATEGORIES = [
  { id: "contract", label: "Contract" },
  { id: "agreement", label: "Agreement" },
  { id: "presentation", label: "Presentation" },
  { id: "invoice", label: "Invoice" },
  { id: "other", label: "Other" },
];

const LINK_TYPES = [
  { id: "google_doc", label: "Google Doc", color: "text-blue-600", bg: "bg-blue-50" },
  { id: "google_sheet", label: "Google Sheet", color: "text-green-600", bg: "bg-green-50" },
  { id: "google_slide", label: "Google Slides", color: "text-yellow-600", bg: "bg-yellow-50" },
  { id: "other", label: "Other Link", color: "text-muted-foreground", bg: "bg-muted" },
];

const getLinkType = (url: string): string => {
  if (url.includes("docs.google.com/document")) return "google_doc";
  if (url.includes("docs.google.com/spreadsheets")) return "google_sheet";
  if (url.includes("docs.google.com/presentation")) return "google_slide";
  return "other";
};

const LinkIcon = ({ type, className }: { type: string; className?: string }) => {
  const icons: Record<string, string> = {
    google_doc: "📄",
    google_sheet: "📊",
    google_slide: "📑",
    other: "🔗",
  };
  return <span className={cn("text-base", className)}>{icons[type] || "🔗"}</span>;
};

const FileIcon = ({ fileType, className }: { fileType: string | null; className?: string }) => {
  if (!fileType) return <File className={cn("w-5 h-5 text-muted-foreground", className)} />;
  if (fileType.includes("pdf")) return <FileText className={cn("w-5 h-5 text-red-500", className)} />;
  if (fileType.includes("image")) return <FileImage className={cn("w-5 h-5 text-purple-500", className)} />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv"))
    return <FileSpreadsheet className={cn("w-5 h-5 text-green-600", className)} />;
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return <Presentation className={cn("w-5 h-5 text-orange-500", className)} />;
  if (fileType.includes("word") || fileType.includes("document"))
    return <FileText className={cn("w-5 h-5 text-blue-600", className)} />;
  return <File className={cn("w-5 h-5 text-muted-foreground", className)} />;
};

const formatBytes = (bytes: number | null): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FilesManager = ({ eventId }: FilesManagerProps) => {
  const { files, links, loading, uploading, uploadFile, deleteFile, downloadFile, addLink, deleteLink } = useEventFiles(eventId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("other");
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkForm, setLinkForm] = useState({ title: "", url: "" });
  const [linkFormError, setLinkFormError] = useState("");
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLinkTitle, setEditingLinkTitle] = useState("");

  const handleFiles = async (fileList: FileList) => {
    for (const file of Array.from(fileList)) {
      await uploadFile(file, uploadCategory);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const handleAddLink = async () => {
    if (!linkForm.title.trim() || !linkForm.url.trim()) {
      setLinkFormError("Both title and URL are required.");
      return;
    }
    const type = getLinkType(linkForm.url);
    const result = await addLink(linkForm.title.trim(), linkForm.url.trim(), type);
    if (result) {
      setLinkForm({ title: "", url: "" });
      setIsAddingLink(false);
      setLinkFormError("");
    }
  };

  const handleUrlChange = (url: string) => {
    setLinkForm(prev => {
      // Auto-fill title if empty and URL looks like a Google doc
      let title = prev.title;
      if (!title) {
        if (url.includes("docs.google.com/document")) title = "Google Doc";
        else if (url.includes("docs.google.com/spreadsheets")) title = "Google Sheet";
        else if (url.includes("docs.google.com/presentation")) title = "Google Slides";
      }
      return { title, url };
    });
  };

  const linkTypeConfig = (type: string) => LINK_TYPES.find(t => t.id === type) || LINK_TYPES[3];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground animate-pulse">
        Loading files...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── Upload Section ── */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Files</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Contracts, agreements, presentations & more</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={uploadCategory}
              onChange={e => setUploadCategory(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary"
            >
              {FILE_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <Button size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>

        {/* Drop Zone */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-5",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <Upload className={cn("w-8 h-8 mx-auto mb-2 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
          <p className="text-sm text-muted-foreground">
            Drag & drop files here, or <span className="text-primary font-medium">click to browse</span>
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">PDF, Word, Excel, PowerPoint, images — up to 50MB each</p>
        </div>

        {/* File List */}
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No files uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {files.map(file => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <FileIcon fileType={file.file_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="capitalize px-1.5 py-0.5 bg-muted rounded text-[10px] font-medium">{file.category}</span>
                    {file.file_size && <span>{formatBytes(file.file_size)}</span>}
                    <span>{format(new Date(file.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => downloadFile(file.file_path, file.name)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteFile(file.id, file.file_path)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Links Section ── */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Links</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Google Docs, Sheets, Slides & other links</p>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsAddingLink(true)}>
            <Plus className="w-4 h-4" />
            Add Link
          </Button>
        </div>

        {/* Quick-add buttons */}
        <div className="flex gap-2 flex-wrap mb-5">
          {LINK_TYPES.slice(0, 3).map(type => (
            <button
              key={type.id}
              onClick={() => { setIsAddingLink(true); setLinkForm({ title: type.label, url: "" }); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border transition-colors hover:border-primary/50",
                type.bg, type.color
              )}
            >
              <LinkIcon type={type.id} />
              {type.label}
            </button>
          ))}
        </div>

        {/* Add Link Form */}
        <AnimatePresence>
          {isAddingLink && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <Input
                  placeholder="Title (e.g. Venue Contract, Speaker Deck)"
                  value={linkForm.title}
                  onChange={e => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                  className="h-9"
                />
                <Input
                  placeholder="URL (paste any link)"
                  value={linkForm.url}
                  onChange={e => handleUrlChange(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAddLink(); if (e.key === "Escape") { setIsAddingLink(false); setLinkForm({ title: "", url: "" }); }}}
                  className="h-9"
                />
                {linkFormError && <p className="text-xs text-destructive">{linkFormError}</p>}
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => { setIsAddingLink(false); setLinkForm({ title: "", url: "" }); setLinkFormError(""); }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddLink} className="gap-2">
                    <Check className="w-3.5 h-3.5" />
                    Save Link
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Links List */}
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No links added yet.</p>
        ) : (
          <div className="space-y-2">
            {links.map(link => {
              const config = linkTypeConfig(link.link_type);
              const isEditing = editingLinkId === link.id;
              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg", config.bg)}>
                    <LinkIcon type={link.link_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingLinkTitle}
                        onChange={e => setEditingLinkTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            updateLink(link.id, { title: editingLinkTitle.trim() || link.title });
                            setEditingLinkId(null);
                          }
                          if (e.key === "Escape") setEditingLinkId(null);
                        }}
                        onBlur={() => {
                          updateLink(link.id, { title: editingLinkTitle.trim() || link.title });
                          setEditingLinkId(null);
                        }}
                        className="w-full text-sm font-medium bg-background border border-primary rounded px-2 py-0.5 outline-none"
                      />
                    ) : (
                      <p
                        className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                        onClick={() => { setEditingLinkId(link.id); setEditingLinkTitle(link.title); }}
                        title="Click to rename"
                      >
                        {link.title}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FilesManager;
