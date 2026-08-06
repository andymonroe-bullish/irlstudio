import { useState } from "react";
import { Users, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PerAttendeeBudgetProps {
  label: string;
  totalAmount: number;
  totalLabel: string;
  attendeeCount: number | null;
  onUpdateAttendees: (count: number) => Promise<void> | void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const PerAttendeeBudget = ({
  label,
  totalAmount,
  totalLabel,
  attendeeCount,
  onUpdateAttendees,
}: PerAttendeeBudgetProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const count = attendeeCount ?? 0;
  const perAttendee = count > 0 ? totalAmount / count : null;

  const startEditing = () => {
    setDraft(count > 0 ? String(count) : "");
    setIsEditing(true);
  };

  const commit = () => {
    if (!isEditing) return;
    setIsEditing(false);
    const parsed = parseInt(draft, 10);
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    if (next !== count) onUpdateAttendees(next);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
          <Users className="w-3 h-3" />
          {label}
        </div>
        <span className="text-2xl font-bold text-foreground">
          {perAttendee !== null ? formatCurrency(perAttendee) : "—"}
        </span>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {count > 0
            ? `${formatCurrency(totalAmount)} ${totalLabel} ÷ ${count.toLocaleString()} attendee${count === 1 ? "" : "s"}`
            : `Set the attendee count to see the ${totalLabel} per attendee`}
        </p>
      </div>
      <div className="text-right">
        <div className="text-muted-foreground text-xs mb-1">Attendees</div>
        {isEditing ? (
          <Input
            autoFocus
            type="text"
            inputMode="numeric"
            value={draft}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setIsEditing(false);
            }}
            className="h-8 w-24 text-right text-sm ml-auto"
          />
        ) : (
          <button
            onClick={startEditing}
            className="group flex items-center gap-1.5 ml-auto"
            title="Edit attendee count"
          >
            <span className="text-2xl font-bold text-foreground">
              {count > 0 ? count.toLocaleString() : "Set count"}
            </span>
            <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PerAttendeeBudget;
