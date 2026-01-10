import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Trash2, GripVertical } from "lucide-react";
import { BudgetItem, BUDGET_CATEGORIES } from "./types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BudgetItemRowProps {
  item: BudgetItem;
  index: number;
  onUpdate: (id: string, updates: Partial<BudgetItem>) => void;
  onDelete: (id: string) => void;
}

const BudgetItemRow = ({ item, index, onUpdate, onDelete }: BudgetItemRowProps) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const category = BUDGET_CATEGORIES.find((c) => c.id === item.category);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "group grid grid-cols-[1fr,120px,100px,80px,100px,40px] gap-4 items-center py-4 px-4 border-b border-border/50 transition-all hover:bg-secondary/30",
            snapshot.isDragging && "shadow-lg bg-card border border-primary/20 rounded-lg"
          )}
        >
          {/* Drag Handle + Item Name */}
          <div className="flex items-center gap-3">
            <div
              {...provided.dragHandleProps}
              className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <div>
              {isEditing === "name" ? (
                <Input
                  autoFocus
                  value={item.name}
                  onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                  onBlur={() => setIsEditing(null)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditing(null)}
                  className="h-8 w-48"
                />
              ) : (
                <div
                  className="cursor-pointer hover:text-primary"
                  onClick={() => setIsEditing("name")}
                >
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="block text-xs text-muted-foreground uppercase">
                    {item.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold uppercase",
                  category?.color || "bg-gray-100 text-gray-700"
                )}
              >
                {category?.name || item.category}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-card border-border">
              {BUDGET_CATEGORIES.map((cat) => (
                <DropdownMenuItem
                  key={cat.id}
                  onClick={() => onUpdate(item.id, { category: cat.id })}
                >
                  <span className={cn("px-2 py-0.5 rounded text-xs", cat.color)}>
                    {cat.name}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Estimated Cost */}
          {isEditing === "estimated" ? (
            <Input
              autoFocus
              type="number"
              value={item.estimatedCost}
              onChange={(e) =>
                onUpdate(item.id, { estimatedCost: Number(e.target.value) })
              }
              onBlur={() => setIsEditing(null)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditing(null)}
              className="h-8 w-24"
            />
          ) : (
            <span
              className="text-foreground cursor-pointer hover:text-primary"
              onClick={() => setIsEditing("estimated")}
            >
              {formatCurrency(item.estimatedCost)}
            </span>
          )}

          {/* Actual Cost */}
          {isEditing === "actual" ? (
            <Input
              autoFocus
              type="number"
              value={item.actualCost}
              onChange={(e) =>
                onUpdate(item.id, { actualCost: Number(e.target.value) })
              }
              onBlur={() => setIsEditing(null)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditing(null)}
              className="h-8 w-20"
            />
          ) : (
            <span
              className={cn(
                "cursor-pointer hover:text-primary",
                item.actualCost > 0 ? "text-foreground" : "text-green-600"
              )}
              onClick={() => setIsEditing("actual")}
            >
              {item.actualCost > 0 ? formatCurrency(item.actualCost) : "0"}
            </span>
          )}

          {/* Due Date */}
          <Input
            type="date"
            value={item.dueDate}
            onChange={(e) => onUpdate(item.id, { dueDate: e.target.value })}
            className="h-8 text-xs"
          />

          {/* Delete */}
          <button
            onClick={() => onDelete(item.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </Draggable>
  );
};

export default BudgetItemRow;
