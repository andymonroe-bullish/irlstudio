import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Trash2, LogOut, Pencil, Check, X, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEvents, Event } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InviteCollaboratorDialog } from "@/components/InviteCollaboratorDialog";
import { PendingInvitationsBanner } from "@/components/PendingInvitationsBanner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const EventCard = ({ 
  event, 
  onDelete,
  onUpdateName 
}: { 
  event: Event; 
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(event.name || "");

  const eventTypeLabels: Record<string, string> = {
    mastermind: "Mastermind",
    fulfillment: "Fulfillment",
    acquisition: "Acquisition",
    activation: "Activation",
    networking: "Networking",
  };

  const displayName = event.name || `${eventTypeLabels[event.type] || event.type} Event`;

  const handleSaveName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editName.trim()) {
      onUpdateName(event.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(event.name || "");
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => !isEditing && navigate(`/event/${event.slug || event.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">
            {eventTypeLabels[event.type] || event.type}
          </span>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
              <Input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveName(e as any);
                  }
                  if (e.key === "Escape") {
                    handleCancelEdit(e as any);
                  }
                }}
                className="h-8 text-lg font-semibold"
              />
              <button
                onClick={handleSaveName}
                className="p-1 rounded hover:bg-primary/10 text-primary"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-xl font-semibold text-foreground truncate">
                {displayName}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditName(displayName);
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this event and all its data including tasks, budget items, and projections.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(event.id);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            {format(new Date(event.event_date), "MMM d, yyyy")}
            {event.event_end_date && ` - ${format(new Date(event.event_end_date), "MMM d, yyyy")}`}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Created {format(new Date(event.created_at), "MMM d, yyyy")}
        </span>
      </div>
    </motion.div>
  );
};

const EventsList = () => {
  const navigate = useNavigate();
  const { events, loading, deleteEvent, updateEventName, refetch } = useEvents();
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const needsName = !profileLoading && profile !== null && !profile.full_name?.trim();

  const handleInvitationAccepted = useCallback(() => {
    // Refresh events list when an invitation is accepted
    refetch();
  }, [refetch]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Events</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
              {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <InviteCollaboratorDialog events={events} />
            <Button
              onClick={() => navigate("/create-event")}
              className="gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create New Event</span>
              <span className="sm:hidden">New</span>
            </Button>
            <Button variant="outline" onClick={() => navigate("/settings")} size="sm" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button variant="outline" onClick={handleLogout} size="sm" className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Prompt to set a name so teammates can assign tasks to you */}
        {needsName && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <SettingsIcon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-foreground">
                Add your name so teammates can assign you to tasks.
              </span>
            </div>
            <Button size="sm" onClick={() => navigate("/settings")} className="flex-shrink-0">
              Add your name
            </Button>
          </div>
        )}

        {/* Pending Invitations Banner */}
        <PendingInvitationsBanner onAccepted={handleInvitationAccepted} />

        {/* Events Grid or Empty State */}
        {events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="bg-muted/50 rounded-full p-6 mb-6">
              <Calendar className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">No events yet</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first event to start planning your next successful gathering.
            </p>
            <Button
              onClick={() => navigate("/create-event")}
              size="lg"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Your First Event
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onDelete={deleteEvent} 
                onUpdateName={updateEventName}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;