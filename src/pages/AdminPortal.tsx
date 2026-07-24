import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  FileText,
  Pencil,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  Circle,
  Users,
  Webhook,
  RefreshCw,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isAdminEmail } from "@/lib/admins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Meeting {
  id: string;
  source: string;
  title: string;
  meeting_date: string | null;
  attendees: unknown;
  summary: string | null;
  notes: unknown;
  action_items: unknown;
  transcript: string | null;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
}

// Attendees / action items arrive as free-form JSON from Circleback; render
// whatever shape shows up without crashing.
const attendeeNames = (attendees: unknown): string[] => {
  if (!Array.isArray(attendees)) return [];
  return attendees
    .map((a: any) =>
      typeof a === "string" ? a : a?.name || a?.displayName || a?.email || null
    )
    .filter(Boolean);
};

const actionItemsList = (items: unknown): { text: string; meta: string | null }[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item: any) => {
      if (typeof item === "string") return { text: item, meta: null };
      const text = item?.title || item?.text || item?.name || item?.description;
      if (!text) return null;
      const meta = [
        item?.assignee?.name || item?.assignee?.email || (typeof item?.assignee === "string" ? item.assignee : null),
        item?.dueDate || item?.due_date,
      ]
        .filter(Boolean)
        .join(" · ");
      return { text: String(text), meta: meta || null };
    })
    .filter(Boolean) as { text: string; meta: string | null }[];
};

const notesText = (notes: unknown): string | null => {
  if (notes == null) return null;
  if (typeof notes === "string") return notes;
  if (Array.isArray(notes)) {
    return notes
      .map((section: any) =>
        typeof section === "string"
          ? section
          : [section?.title || section?.heading, section?.content || section?.text]
              .filter(Boolean)
              .join("\n")
      )
      .filter(Boolean)
      .join("\n\n");
  }
  return JSON.stringify(notes, null, 2);
};

const AdminPortal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const isAdmin = isAdminEmail(user?.email);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({
        title: "Error loading meetings",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMeetings((data as Meeting[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (isAdmin) fetchMeetings();
  }, [isAdmin, fetchMeetings]);

  const renameMeeting = async (id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) {
      setEditingTitle(false);
      return;
    }
    const { data, error } = await supabase
      .from("meetings")
      .update({ title: trimmed })
      .eq("id", id)
      .select();
    if (error || !data?.length) {
      toast({
        title: "Error renaming meeting",
        description: error?.message || "You don't have permission to rename this meeting.",
        variant: "destructive",
      });
      return;
    }
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, title: trimmed } : m)));
    setEditingTitle(false);
    toast({ title: "Meeting renamed" });
  };

  const deleteMeeting = async (id: string) => {
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting meeting", description: error.message, variant: "destructive" });
      return;
    }
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast({ title: "Meeting deleted" });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Admin access only</h1>
          <p className="text-muted-foreground text-sm">
            This portal is restricted. You're signed in as{" "}
            <span className="font-medium text-foreground">{user?.email}</span>, which
            doesn't have admin access.
          </p>
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const selected = meetings.find((m) => m.id === selectedId) || null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Admin Portal
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Meeting Notes &amp; Transcripts
            </h1>
            <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={fetchMeetings}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* How data gets here */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <Webhook className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-muted-foreground">
            Meetings land here automatically from Circleback via webhook{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              POST https://irlstudio.vercel.app/api/webhooks/circleback
            </code>{" "}
            and are readable by the Hermes agent through the v1 API, which sifts
            them and creates tasks in the right events.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-pulse text-muted-foreground">Loading meetings...</div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">No meetings yet</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Once Circleback is pointed at the webhook above, every meeting summary,
              action item list, and transcript will show up here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,1fr)_2fr] gap-4">
            {/* Meeting list */}
            <div className="space-y-2">
              {meetings.map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => {
                    setSelectedId(meeting.id);
                    setEditingTitle(false);
                  }}
                  className={cn(
                    "w-full text-left rounded-xl border px-4 py-3 transition-colors group",
                    selectedId === meeting.id
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {meeting.title}
                    </p>
                    {meeting.processed ? (
                      <span title="Processed by agent">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      </span>
                    ) : (
                      <span title="Not yet processed">
                        <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(
                      new Date(meeting.meeting_date || meeting.created_at),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                  {attendeeNames(meeting.attendees).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      {attendeeNames(meeting.attendees).join(", ")}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Detail */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 min-h-[300px]">
              {!selected ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground py-16">
                  Select a meeting to view its notes, action items, and transcript.
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      {editingTitle ? (
                        <div className="flex items-center gap-2">
                          <Input
                            autoFocus
                            value={titleDraft}
                            onChange={(e) => setTitleDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") renameMeeting(selected.id, titleDraft);
                              if (e.key === "Escape") setEditingTitle(false);
                            }}
                            className="h-9 text-lg font-semibold"
                          />
                          <button
                            onClick={() => renameMeeting(selected.id, titleDraft)}
                            className="p-1.5 rounded hover:bg-primary/10 text-primary transition-all flex-shrink-0"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingTitle(false)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-all flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/title">
                          <h2 className="text-lg font-semibold text-foreground truncate">
                            {selected.title}
                          </h2>
                          <button
                            onClick={() => {
                              setTitleDraft(selected.title);
                              setEditingTitle(true);
                            }}
                            title="Rename meeting"
                            className="p-1 rounded opacity-0 group-hover/title:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(
                          new Date(selected.meeting_date || selected.created_at),
                          "MMMM d, yyyy 'at' h:mm a"
                        )}
                        {selected.processed && selected.processed_at && (
                          <span className="text-green-600">
                            {" "}
                            · processed {format(new Date(selected.processed_at), "MMM d")}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmDeleteId(selected.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Tabs defaultValue="summary">
                    <TabsList>
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="actions">
                        Action Items
                        {actionItemsList(selected.action_items).length > 0 && (
                          <span className="ml-1.5 text-xs bg-muted px-1.5 rounded">
                            {actionItemsList(selected.action_items).length}
                          </span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="mt-4 space-y-4">
                      {selected.summary ? (
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selected.summary}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No summary provided.</p>
                      )}
                      {notesText(selected.notes) && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-1">Notes</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {notesText(selected.notes)}
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="actions" className="mt-4">
                      {actionItemsList(selected.action_items).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No action items.</p>
                      ) : (
                        <ul className="space-y-2">
                          {actionItemsList(selected.action_items).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Circle className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                              <div>
                                <span className="text-foreground">{item.text}</span>
                                {item.meta && (
                                  <span className="text-xs text-muted-foreground ml-2">{item.meta}</span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TabsContent>

                    <TabsContent value="transcript" className="mt-4">
                      {selected.transcript ? (
                        <div className="max-h-[50vh] overflow-y-auto rounded-lg bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                            {selected.transcript}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No transcript provided.</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              The summary, action items, and transcript will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && deleteMeeting(confirmDeleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPortal;
