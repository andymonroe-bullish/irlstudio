import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CalendarPlus, MapPin, Clock, ChevronRight, Pencil, Trash2, X, Check } from "lucide-react";
import { useItinerary, ItinerarySession } from "@/hooks/useItinerary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, parse, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ItineraryManagerProps {
  eventId: string;
  eventStartDate: string;
}

const ItineraryManager = ({ eventId, eventStartDate }: ItineraryManagerProps) => {
  const { sessions, loading, days, addSession, updateSession, deleteSession, addDay } = useItinerary(eventId);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [editingSession, setEditingSession] = useState<ItinerarySession | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_time: "09:00",
    end_time: "10:00",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      start_time: "09:00",
      end_time: "10:00",
    });
  };

  const handleAddDay = async () => {
    const nextDay = addDay();
    setSelectedDay(nextDay);
    // Add a placeholder session for the new day
    await addSession(nextDay, {
      title: "New Session",
      start_time: "09:00",
      end_time: "10:00",
    });
  };

  const handleAddSession = async () => {
    if (!formData.title.trim()) return;
    
    await addSession(selectedDay, formData);
    setIsAddingSession(false);
    resetForm();
  };

  const handleEditSession = (session: ItinerarySession) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description || "",
      location: session.location || "",
      start_time: session.start_time,
      end_time: session.end_time,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSession || !formData.title.trim()) return;
    
    await updateSession(editingSession.id, formData);
    setEditingSession(null);
    resetForm();
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
  };

  const formatTime = (timeStr: string) => {
    try {
      const time = parse(timeStr, "HH:mm:ss", new Date());
      return format(time, "HH:mm");
    } catch {
      return timeStr.substring(0, 5);
    }
  };

  const calculateDuration = (start: string, end: string) => {
    try {
      const startTime = parse(start, "HH:mm:ss", new Date());
      const endTime = parse(end, "HH:mm:ss", new Date());
      const diffMs = endTime.getTime() - startTime.getTime();
      const diffMins = Math.round(diffMs / 60000);
      if (diffMins >= 60) {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      }
      return `${diffMins}m`;
    } catch {
      return "";
    }
  };

  const getDayDate = (dayNumber: number) => {
    try {
      const startDate = new Date(eventStartDate);
      const dayDate = addDays(startDate, dayNumber - 1);
      return format(dayDate, "MMM d");
    } catch {
      return "";
    }
  };

  const sessionsForDay = sessions.filter(s => s.day_number === selectedDay);
  const availableDays = days.length > 0 ? days : [1];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading itinerary...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-2xl font-bold text-foreground mb-1">Event Itinerary</h2>
        <p className="text-muted-foreground text-sm">Plan the run of show, session by session.</p>
      </div>

      {/* Day Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        {availableDays.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`
              flex flex-col items-center px-4 py-3 rounded-xl transition-all duration-200 border
              ${selectedDay === day
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }
            `}
          >
            <span className="text-xs font-semibold uppercase">Day {day}</span>
            <span className="text-sm font-medium">{getDayDate(day)}</span>
          </button>
        ))}
        <button
          onClick={handleAddDay}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all duration-200"
        >
          <CalendarPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Sessions Timeline */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {sessionsForDay.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sessions for this day yet.</p>
                <p className="text-sm mt-1">Add your first session below.</p>
              </div>
            ) : (
              sessionsForDay.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-4"
                >
                  {/* Time Column */}
                  <div className="w-16 flex-shrink-0 text-right">
                    <div className="text-sm font-semibold text-foreground">
                      {formatTime(session.start_time)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(session.end_time)}
                    </div>
                  </div>

                  {/* Session Card */}
                  <div className="flex-1 group relative bg-muted/30 hover:bg-muted/50 rounded-xl p-4 border border-border transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{session.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {session.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {calculateDuration(session.start_time, session.end_time)}
                          </span>
                        </div>
                        {session.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {session.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditSession(session)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50 ml-2" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            {/* Add Session Button */}
            <button
              onClick={() => {
                resetForm();
                setIsAddingSession(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Session
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Add Session Dialog */}
      <Dialog open={isAddingSession} onOpenChange={setIsAddingSession}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Session title"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Start Time</label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">End Time</label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Main Stage, Conference Room A"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the session"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddingSession(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSession} disabled={!formData.title.trim()}>
              Add Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Session title"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Start Time</label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">End Time</label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Main Stage, Conference Room A"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the session"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingSession(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!formData.title.trim()}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ItineraryManager;
