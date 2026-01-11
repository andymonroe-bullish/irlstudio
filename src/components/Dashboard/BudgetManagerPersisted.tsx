import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, DollarSign, Trash2 } from "lucide-react";
import { BudgetItem } from "@/hooks/useEvents";
import { BUDGET_CATEGORIES } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BudgetManagerPersistedProps {
  totalBudget: number;
  items: BudgetItem[];
  onUpdateItem: (id: string, updates: Partial<BudgetItem>) => Promise<void>;
  onAddItem: (item: Omit<BudgetItem, "id" | "event_id" | "sort_order">) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onReorderItems: (items: BudgetItem[]) => Promise<void>;
}

const BudgetManagerPersisted = ({
  totalBudget,
  items,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
}: BudgetManagerPersistedProps) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "other",
    estimatedCost: 0,
  });

  const totalEstimated = items.reduce((sum, item) => sum + item.estimated_cost, 0);
  const totalActual = items.reduce((sum, item) => sum + item.actual_cost, 0);
  const remaining = totalBudget - totalEstimated;
  const budgetUsedPercent = totalBudget > 0 ? Math.min((totalEstimated / totalBudget) * 100, 100) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleUpdateItem = (id: string, field: string, value: string | number) => {
    const dbUpdates: Partial<BudgetItem> = {};
    if (field === "name") dbUpdates.name = value as string;
    if (field === "category") dbUpdates.category = value as string;
    if (field === "estimated_cost") dbUpdates.estimated_cost = value as number;
    if (field === "actual_cost") dbUpdates.actual_cost = value as number;
    onUpdateItem(id, dbUpdates);
  };

  const handleAddItem = () => {
    if (newItem.name.trim()) {
      onAddItem({
        name: newItem.name,
        category: newItem.category,
        estimated_cost: newItem.estimatedCost,
        actual_cost: 0,
        due_date: null,
        status: "planned",
      });
      setNewItem({ name: "", category: "other", estimatedCost: 0 });
      setIsAddingItem(false);
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const cat = BUDGET_CATEGORIES.find((c) => c.id === categoryId);
    return cat?.color || "bg-muted text-muted-foreground";
  };

  const getCategoryName = (categoryId: string) => {
    const cat = BUDGET_CATEGORIES.find((c) => c.id === categoryId);
    return cat?.name || categoryId;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {/* Compact Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <DollarSign className="w-3 h-3" />
            Budget
          </div>
          <span className="text-lg font-bold text-foreground">{formatCurrency(totalBudget)}</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="text-muted-foreground text-xs mb-1">Estimated</div>
          <span className="text-lg font-bold text-foreground">{formatCurrency(totalEstimated)}</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="text-muted-foreground text-xs mb-1">Actual</div>
          <span className="text-lg font-bold text-green-600">{formatCurrency(totalActual)}</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="text-muted-foreground text-xs mb-1">Remaining</div>
          <span className={cn("text-lg font-bold", remaining >= 0 ? "text-green-600" : "text-destructive")}>
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card rounded-xl border border-border p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Budget Used</span>
          <span>{budgetUsedPercent.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              budgetUsedPercent > 100 ? "bg-destructive" : budgetUsedPercent > 80 ? "bg-yellow-500" : "bg-primary"
            )}
            style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Compact Expense Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-medium text-foreground text-sm">Expenses</h3>
          <Button size="sm" variant="ghost" onClick={() => setIsAddingItem(true)} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[1fr,100px,80px,80px,32px] gap-2 px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">
          <span>Item</span>
          <span>Category</span>
          <span>Est.</span>
          <span>Actual</span>
          <span></span>
        </div>

        {/* Items */}
        <div className="max-h-[280px] overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="group grid grid-cols-1 sm:grid-cols-[1fr,100px,80px,80px,32px] gap-2 px-3 py-2 border-b border-border/50 hover:bg-muted/20 items-center"
            >
              {/* Mobile: Stacked Layout */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground text-sm truncate">{item.name}</span>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", getCategoryColor(item.category))}>
                    {getCategoryName(item.category)}
                  </span>
                  <span className="text-muted-foreground">Est: {formatCurrency(item.estimated_cost)}</span>
                  <span className="text-green-600">Act: {formatCurrency(item.actual_cost)}</span>
                </div>
              </div>

              {/* Desktop: Grid Layout */}
              <Input
                value={item.name}
                onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                className="hidden sm:block h-7 text-sm border-0 bg-transparent p-0 focus-visible:ring-0"
              />
              <Select
                value={item.category}
                onValueChange={(v) => handleUpdateItem(item.id, "category", v)}
              >
                <SelectTrigger className="hidden sm:flex h-7 text-[10px] border-0 bg-transparent p-0 gap-1">
                  <span className={cn("px-1.5 py-0.5 rounded font-medium", getCategoryColor(item.category))}>
                    {getCategoryName(item.category)}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {BUDGET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      <span className={cn("px-1.5 py-0.5 rounded", cat.color)}>{cat.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={item.estimated_cost}
                onChange={(e) => handleUpdateItem(item.id, "estimated_cost", Number(e.target.value))}
                className="hidden sm:block h-7 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 w-full"
              />
              <Input
                type="number"
                value={item.actual_cost}
                onChange={(e) => handleUpdateItem(item.id, "actual_cost", Number(e.target.value))}
                className="hidden sm:block h-7 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 text-green-600 w-full"
              />
              <button
                onClick={() => onDeleteItem(item.id)}
                className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Item Inline */}
        {isAddingItem && (
          <div className="p-3 border-t border-border bg-muted/20">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Item name..."
                value={newItem.name}
                onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                className="h-8 text-sm flex-1"
                autoFocus
              />
              <Select
                value={newItem.category}
                onValueChange={(v) => setNewItem((prev) => ({ ...prev, category: v }))}
              >
                <SelectTrigger className="h-8 text-xs w-full sm:w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {BUDGET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0"
                value={newItem.estimatedCost || ""}
                onChange={(e) => setNewItem((prev) => ({ ...prev, estimatedCost: Number(e.target.value) }))}
                className="h-8 text-sm w-full sm:w-20"
              />
              <div className="flex gap-1">
                <Button size="sm" onClick={handleAddItem} className="h-8 text-xs">Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingItem(false)} className="h-8 text-xs">Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 && !isAddingItem && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No expenses yet. Click "Add" to create one.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BudgetManagerPersisted;
