import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Folder, FolderOpen, FileText, Trash2, Search, Edit2, Check, X, Bold, Italic } from "lucide-react";
import { useNotes, NoteFolder, Note } from "@/hooks/useNotes";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NotesManagerProps {
  eventId: string;
}

const NotesManager = ({ eventId }: NotesManagerProps) => {
  const { folders, notes, loading, addFolder, updateFolder, deleteFolder, addNote, updateNote, deleteNote } = useNotes(eventId);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null | "all">("all");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false });

  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;

  // Sync local state when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setLocalTitle(selectedNote.title);
      setLocalContent(selectedNote.content);
      // Set innerHTML after render
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.innerHTML = selectedNote.content || "";
        }
      }, 0);
    } else {
      setLocalTitle("");
      setLocalContent("");
      if (contentRef.current) contentRef.current.innerHTML = "";
    }
  }, [selectedNoteId]);

  const debouncedSave = useCallback((noteId: string, updates: { title?: string; content?: string }) => {
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateNote(noteId, updates);
    }, 600);
  }, [updateNote]);

  const handleTitleChange = (value: string) => {
    setLocalTitle(value);
    if (selectedNoteId) debouncedSave(selectedNoteId, { title: value, content: localContent });
  };

  const handleContentInput = () => {
    if (!contentRef.current || !selectedNoteId) return;
    const html = contentRef.current.innerHTML;
    setLocalContent(html);
    debouncedSave(selectedNoteId, { title: localTitle, content: html });
  };

  const updateFormatState = () => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
    });
  };

  const applyFormat = (command: "bold" | "italic") => {
    contentRef.current?.focus();
    document.execCommand(command, false);
    updateFormatState();
    handleContentInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "b") { e.preventDefault(); applyFormat("bold"); }
    if ((e.metaKey || e.ctrlKey) && e.key === "i") { e.preventDefault(); applyFormat("italic"); }
  };

  const handleNewNote = async () => {
    const folderId = selectedFolderId === "all" ? null : selectedFolderId;
    const note = await addNote(folderId);
    if (note) {
      setSelectedNoteId(note.id);
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  };

  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNote(noteId);
    if (selectedNoteId === noteId) setSelectedNoteId(null);
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    const folder = await addFolder(newFolderName.trim());
    if (folder) {
      setSelectedFolderId(folder.id);
      setNewFolderName("");
      setIsAddingFolder(false);
    }
  };

  const handleSaveFolderName = async (folderId: string) => {
    if (editingFolderName.trim()) await updateFolder(folderId, editingFolderName.trim());
    setEditingFolderId(null);
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteFolder(folderId);
    if (selectedFolderId === folderId) setSelectedFolderId("all");
  };

  // Filter notes
  const visibleNotes = notes.filter(n => {
    const matchesFolder = selectedFolderId === "all" || n.folder_id === selectedFolderId;
    const matchesSearch = !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const previewText = (content: string) => {
    const first = content.split("\n").find(l => l.trim()) || "";
    return first.length > 60 ? first.slice(0, 60) + "…" : first;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Loading notes...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden shadow-card"
      style={{ minHeight: 560 }}
    >
      <div className="flex h-full" style={{ minHeight: 560 }}>

        {/* ── Sidebar ── */}
        <div className="w-56 flex-shrink-0 border-r border-border flex flex-col bg-muted/20">

          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 bg-background rounded-lg px-2 py-1.5 border border-border">
              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search notes…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* All Notes */}
          <button
            onClick={() => setSelectedFolderId("all")}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors text-left",
              selectedFolderId === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>All Notes</span>
            <span className="ml-auto text-xs">{notes.length}</span>
          </button>

          {/* Folders */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Folders</span>
              <button
                onClick={() => setIsAddingFolder(true)}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isAddingFolder && (
              <div className="px-3 pb-2 flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleAddFolder();
                    if (e.key === "Escape") { setIsAddingFolder(false); setNewFolderName(""); }
                  }}
                  placeholder="Folder name…"
                  className="flex-1 bg-background border border-border rounded px-1.5 py-1 text-xs outline-none focus:border-primary"
                />
                <button onClick={handleAddFolder} className="p-1 text-primary hover:bg-primary/10 rounded">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => { setIsAddingFolder(false); setNewFolderName(""); }} className="p-1 text-muted-foreground hover:bg-muted rounded">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {folders.map(folder => (
              <div key={folder.id} className="group relative">
                {editingFolderId === folder.id ? (
                  <div className="px-3 py-1.5 flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      value={editingFolderName}
                      onChange={e => setEditingFolderName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleSaveFolderName(folder.id);
                        if (e.key === "Escape") setEditingFolderId(null);
                      }}
                      className="flex-1 bg-background border border-border rounded px-1.5 py-1 text-xs outline-none focus:border-primary"
                    />
                    <button onClick={() => handleSaveFolderName(folder.id)} className="p-1 text-primary hover:bg-primary/10 rounded">
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left",
                      selectedFolderId === folder.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {selectedFolderId === folder.id
                      ? <FolderOpen className="w-4 h-4 flex-shrink-0" />
                      : <Folder className="w-4 h-4 flex-shrink-0" />
                    }
                    <span className="flex-1 truncate">{folder.name}</span>
                    <span className="text-xs opacity-60">
                      {notes.filter(n => n.folder_id === folder.id).length}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}
                        className="p-0.5 hover:text-foreground rounded"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={e => handleDeleteFolder(folder.id, e)}
                        className="p-0.5 hover:text-destructive rounded"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* New Note Button */}
          <div className="p-3 border-t border-border">
            <Button size="sm" className="w-full gap-2 text-xs" onClick={handleNewNote}>
              <Plus className="w-3.5 h-3.5" />
              New Note
            </Button>
          </div>
        </div>

        {/* ── Notes List ── */}
        <div className="w-52 flex-shrink-0 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedFolderId === "all" ? "All Notes" : folders.find(f => f.id === selectedFolderId)?.name || "Notes"}
              <span className="ml-2 font-normal normal-case">{visibleNotes.length}</span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {visibleNotes.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground py-8">
                {searchQuery ? "No notes match your search." : "No notes yet.\nClick + New Note to start."}
              </div>
            ) : (
              visibleNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={cn(
                    "group w-full text-left p-3 border-b border-border/50 transition-colors hover:bg-muted/40",
                    selectedNoteId === note.id && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className={cn(
                      "text-sm font-medium truncate flex-1",
                      selectedNoteId === note.id ? "text-foreground" : "text-foreground/80"
                    )}>
                      {note.title || "Untitled"}
                    </p>
                    <button
                      onClick={e => handleDeleteNote(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {previewText(note.content) || "No additional text"}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {format(new Date(note.updated_at), "MMM d")}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Editor ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedNote ? (
            <>
              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 px-6 pt-5 pb-2 border-b border-border/40">
                <button
                  onMouseDown={e => { e.preventDefault(); applyFormat("bold"); }}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded text-sm font-bold transition-colors",
                    activeFormats.bold
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title="Bold (⌘B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onMouseDown={e => { e.preventDefault(); applyFormat("italic"); }}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded transition-colors",
                    activeFormats.italic
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title="Italic (⌘I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-border mx-1" />
                <p className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(selectedNote.updated_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>

              {/* Title */}
              <div className="px-8 pt-5 pb-2">
                <input
                  ref={titleRef}
                  type="text"
                  value={localTitle}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Title"
                  className="w-full text-2xl font-bold bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40 border-none"
                />
              </div>

              {/* Content — contenteditable for rich text */}
              <div className="flex-1 px-8 pb-8 overflow-y-auto">
                <div
                  ref={contentRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleContentInput}
                  onKeyDown={handleKeyDown}
                  onKeyUp={updateFormatState}
                  onMouseUp={updateFormatState}
                  onSelect={updateFormatState}
                  data-placeholder="Start typing…"
                  className="w-full min-h-[400px] bg-transparent outline-none text-foreground text-sm leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No note selected</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select a note from the list or create a new one.
              </p>
              <Button onClick={handleNewNote} className="gap-2">
                <Plus className="w-4 h-4" />
                New Note
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NotesManager;
