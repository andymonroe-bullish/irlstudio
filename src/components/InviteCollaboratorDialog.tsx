import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Event } from "@/hooks/useEvents";
import { useInvitations } from "@/hooks/useInvitations";

interface InviteCollaboratorDialogProps {
  events: Event[];
}

export const InviteCollaboratorDialog = ({ events }: InviteCollaboratorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { inviteToEvents } = useInvitations();

  const handleEventToggle = (eventId: string, checked: boolean) => {
    if (checked) {
      setSelectedEventIds((prev) => [...prev, eventId]);
    } else {
      setSelectedEventIds((prev) => prev.filter((id) => id !== eventId));
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || selectedEventIds.length === 0) return;

    setIsSubmitting(true);
    const success = await inviteToEvents(email.trim(), selectedEventIds, role);
    setIsSubmitting(false);

    if (success) {
      setEmail("");
      setRole("editor");
      setSelectedEventIds([]);
      setOpen(false);
    }
  };

  const eventTypeLabels: Record<string, string> = {
    mastermind: "Mastermind",
    fulfillment: "Fulfillment",
    acquisition: "Acquisition",
    activation: "Activation",
    networking: "Networking",
  };

  const getEventDisplayName = (event: Event) => {
    return event.name || `${eventTypeLabels[event.type] || event.type} Event`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a Collaborator</DialogTitle>
          <DialogDescription>
            Enter their email, choose their access level, and select which events to share.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="collaborator@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Access level</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "editor" | "viewer")}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div>
                    <p className="font-medium">Admin</p>
                    <p className="text-xs text-muted-foreground">Full access — can edit, delete, and invite others</p>
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div>
                    <p className="font-medium">Editor</p>
                    <p className="text-xs text-muted-foreground">Can view and make changes (e.g. employees)</p>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div>
                    <p className="font-medium">Viewer</p>
                    <p className="text-xs text-muted-foreground">Can view only, no edits (e.g. clients)</p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Select events</Label>
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {events.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No events available. Create an event first.
                </p>
              ) : (
                <div className="divide-y">
                  {events.map((event) => (
                    <label
                      key={event.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedEventIds.includes(event.id)}
                        onCheckedChange={(checked) =>
                          handleEventToggle(event.id, checked as boolean)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getEventDisplayName(event)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {eventTypeLabels[event.type] || event.type}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!email.trim() || selectedEventIds.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Inviting..." : "Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
