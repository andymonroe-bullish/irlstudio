import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, DollarSign, Trash2, TrendingUp, ChevronDown, ChevronRight, CornerDownRight } from "lucide-react";
import { BudgetItem, BudgetLineItem, RevenueItem } from "@/hooks/useEvents";
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
  lineItems: BudgetLineItem[];
  revenueItems: RevenueItem[];
  onUpdateItem: (id: string, updates: Partial<BudgetItem>) => Promise<void>;
  onAddItem: (item: Omit<BudgetItem, "id" | "event_id" | "sort_order">) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onReorderItems: (items: BudgetItem[]) => Promise<void>;
  onAddLineItem: (budgetItemId: string, item: { name: string; amount: number }) => Promise<void>;
  onUpdateLineItem: (id: string, updates: Partial<BudgetLineItem>) => Promise<void>;
  onDeleteLineItem: (id: string) => Promise<void>;
  onUpdateRevenueItem: (id: string, updates: Partial<RevenueItem>) => Promise<void>;
  onAddRevenueItem: (item: Omit<RevenueItem, "id" | "event_id" | "sort_order">) => Promise<void>;
  onDeleteRevenueItem: (id: string) => Promise<void>;
}

type LocalEdits = Record<string, { name?: string; estimated_cost?: string; actual_cost?: string }>;
type LocalRevenueEdits = Record<string, { name?: string; amount?: string }>;
type LocalLineEdits = Record<string, { name?: string; amount?: string }>;

const BudgetManagerPersisted = ({
  totalBudget,
  items,
  lineItems,
  revenueItems,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  onAddLineItem,
  onUpdateLineItem,
  onDeleteLineItem,
  onUpdateRevenueItem,
  onAddRevenueItem,
  onDeleteRevenueItem,
}: BudgetManagerPersistedProps) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "other",
    estimatedCost: 0,
  });
  const [isAddingRevenue, setIsAddingRevenue] = useState(false);
  const [newRevenue, setNewRevenue] = useState({ name: "", amount: 0 });
  // Local editing state — only synced to DB on blur
  const [localEdits, setLocalEdits] = useState<LocalEdits>({});
  const [localRevenueEdits, setLocalRevenueEdits] = useState<LocalRevenueEdits>({});
  const [localLineEdits, setLocalLineEdits] = useState<LocalLineEdits>({});
  // Which budget items are expanded to show their itemized lines
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  // Budget item id currently showing the inline "add line item" form
  const [addingLineFor, setAddingLineFor] = useState<string | null>(null);
  const [newLine, setNewLine] = useState({ name: "", amount: 0 });

  const linesFor = (budgetItemId: string) =>
    lineItems.filter((l) => l.budget_item_id === budgetItemId);

  const toggleExpanded = (budgetItemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(budgetItemId)) {
        next.delete(budgetItemId);
      } else {
        next.add(budgetItemId);
      }
      return next;
    });
  };

  const handleAddLine = (budgetItemId: string) => {
    if (newLine.name.trim()) {
      onAddLineItem(budgetItemId, { name: newLine.name.trim(), amount: newLine.amount });
      setNewLine({ name: "", amount: 0 });
      // Keep the form open so several purchases can be logged in a row
    }
  };

  const totalActual = items.reduce((sum, item) => sum + item.actual_cost, 0);
  const totalRevenue = revenueItems.reduce((sum, item) => sum + item.amount, 0);
  const profit = totalRevenue - totalActual;
  const budgetUsedPercent = totalBudget > 0 ? Math.min((totalActual / totalBudget) * 100, 100) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Get display value: raw number while editing, formatted currency when not
  const getDisplayValue = (
    itemId: string,
    field: "estimated_cost" | "actual_cost",
    dbValue: number
  ) => {
    const localVal = localEdits[itemId]?.[field];
    if (localVal !== undefined) return localVal; // raw while editing
    return formatCurrency(dbValue); // formatted when idle
  };

  const getLocalValue = (
    itemId: string,
    field: "name" | "estimated_cost" | "actual_cost",
    dbValue: string | number
  ) => {
    return localEdits[itemId]?.[field] ?? String(dbValue);
  };

  const handleFocusField = (
    itemId: string,
    field: "name" | "estimated_cost" | "actual_cost",
    dbValue: string | number
  ) => {
    setLocalEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: String(dbValue) },
    }));
  };

  const handleLocalChange = (
    itemId: string,
    field: "name" | "estimated_cost" | "actual_cost",
    value: string
  ) => {
    setLocalEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const handleBlurField = (
    itemId: string,
    field: "name" | "estimated_cost" | "actual_cost"
  ) => {
    const localVal = localEdits[itemId]?.[field];
    if (localVal === undefined) return;

    const updates: Partial<BudgetItem> = {};
    if (field === "name") updates.name = localVal;
    if (field === "estimated_cost") updates.estimated_cost = parseFloat(localVal) || 0;
    if (field === "actual_cost") updates.actual_cost = parseFloat(localVal) || 0;

    onUpdateItem(itemId, updates);

    // Clear local edit for this field
    setLocalEdits((prev) => {
      const next = { ...prev };
      if (next[itemId]) {
        const updated = { ...next[itemId] };
        delete updated[field];
        if (Object.keys(updated).length === 0) {
          delete next[itemId];
        } else {
          next[itemId] = updated;
        }
      }
      return next;
    });
  };

  // Revenue rows use the same edit-locally-then-sync-on-blur pattern as expenses
  const getRevenueDisplayValue = (itemId: string, dbValue: number) => {
    const localVal = localRevenueEdits[itemId]?.amount;
    if (localVal !== undefined) return localVal;
    return formatCurrency(dbValue);
  };

  const handleRevenueFocus = (itemId: string, field: "name" | "amount", dbValue: string | number) => {
    setLocalRevenueEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: String(dbValue) },
    }));
  };

  const handleRevenueChange = (itemId: string, field: "name" | "amount", value: string) => {
    setLocalRevenueEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const handleRevenueBlur = (itemId: string, field: "name" | "amount") => {
    const localVal = localRevenueEdits[itemId]?.[field];
    if (localVal === undefined) return;

    const updates: Partial<RevenueItem> = {};
    if (field === "name") updates.name = localVal;
    if (field === "amount") updates.amount = parseFloat(localVal) || 0;

    onUpdateRevenueItem(itemId, updates);

    setLocalRevenueEdits((prev) => {
      const next = { ...prev };
      if (next[itemId]) {
        const updated = { ...next[itemId] };
        delete updated[field];
        if (Object.keys(updated).length === 0) {
          delete next[itemId];
        } else {
          next[itemId] = updated;
        }
      }
      return next;
    });
  };

  // Line items use the same edit-locally-then-sync-on-blur pattern
  const getLineDisplayValue = (lineId: string, dbValue: number) => {
    const localVal = localLineEdits[lineId]?.amount;
    if (localVal !== undefined) return localVal;
    return formatCurrency(dbValue);
  };

  const handleLineFocus = (lineId: string, field: "name" | "amount", dbValue: string | number) => {
    setLocalLineEdits((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], [field]: String(dbValue) },
    }));
  };

  const handleLineChange = (lineId: string, field: "name" | "amount", value: string) => {
    setLocalLineEdits((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], [field]: value },
    }));
  };

  const handleLineBlur = (lineId: string, field: "name" | "amount") => {
    const localVal = localLineEdits[lineId]?.[field];
    if (localVal === undefined) return;

    const updates: Partial<BudgetLineItem> = {};
    if (field === "name") updates.name = localVal;
    if (field === "amount") updates.amount = parseFloat(localVal) || 0;

    onUpdateLineItem(lineId, updates);

    setLocalLineEdits((prev) => {
      const next = { ...prev };
      if (next[lineId]) {
        const updated = { ...next[lineId] };
        delete updated[field];
        if (Object.keys(updated).length === 0) {
          delete next[lineId];
        } else {
          next[lineId] = updated;
        }
      }
      return next;
    });
  };

  const handleAddRevenue = () => {
    if (newRevenue.name.trim()) {
      onAddRevenueItem({ name: newRevenue.name, amount: newRevenue.amount });
      setNewRevenue({ name: "", amount: 0 });
      setIsAddingRevenue(false);
    }
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
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <DollarSign className="w-3 h-3" />
            Budget
          </div>
          <span className="text-2xl font-bold text-foreground">{formatCurrency(totalBudget)}</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="text-muted-foreground text-xs mb-1">Actual Spend</div>
          <span className={cn("text-2xl font-bold", totalActual > totalBudget ? "text-destructive" : "text-green-600")}>
            {formatCurrency(totalActual)}
          </span>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            Revenue
          </div>
          <span className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="text-muted-foreground text-xs mb-1">Profit</div>
          <span className={cn("text-2xl font-bold", profit < 0 ? "text-destructive" : "text-green-600")}>
            {formatCurrency(profit)}
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

      {/* Expense Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-medium text-foreground text-sm">Expenses</h3>
          <Button size="sm" variant="ghost" onClick={() => setIsAddingItem(true)} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[1fr,100px,90px,90px,32px] gap-2 px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">
          <span>Item</span>
          <span>Category</span>
          <span>Estimated</span>
          <span>Actual</span>
          <span></span>
        </div>

        {/* Items */}
        <div>
          {items.map((item) => {
            const itemLines = linesFor(item.id);
            const isExpanded = expandedItems.has(item.id);
            const isItemized = itemLines.length > 0;
            return (
              <div key={item.id} className="border-b border-border/50">
                <div className="group grid grid-cols-1 sm:grid-cols-[1fr,100px,90px,90px,32px] gap-2 px-3 py-2 hover:bg-muted/20 items-center">
                  {/* Mobile: Stacked Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between mb-1">
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="flex items-center gap-1 flex-1 min-w-0 text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-medium text-foreground text-sm truncate">{item.name}</span>
                        {isItemized && (
                          <span className="text-[10px] text-muted-foreground shrink-0">({itemLines.length})</span>
                        )}
                      </button>
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

                  {/* Desktop: Expand Toggle + Name */}
                  <div className="hidden sm:flex items-center gap-1 min-w-0">
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"
                      title={isExpanded ? "Collapse line items" : "Itemize this expense"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <Input
                      value={getLocalValue(item.id, "name", item.name)}
                      onFocus={() => handleFocusField(item.id, "name", item.name)}
                      onChange={(e) => handleLocalChange(item.id, "name", e.target.value)}
                      onBlur={() => handleBlurField(item.id, "name")}
                      className="h-7 text-sm border-0 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-primary/50 rounded flex-1"
                    />
                    {isItemized && (
                      <span className="text-[10px] text-muted-foreground shrink-0 pr-1">
                        {itemLines.length} {itemLines.length === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>

                  {/* Desktop: Category */}
                  <Select
                    value={item.category}
                    onValueChange={(v) => onUpdateItem(item.id, { category: v })}
                  >
                    <SelectTrigger className="hidden sm:flex h-7 text-[10px] border-0 bg-transparent p-0 gap-1 focus:ring-0">
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

                  {/* Desktop: Estimated Cost */}
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={getDisplayValue(item.id, "estimated_cost", item.estimated_cost)}
                    onFocus={(e) => {
                      handleFocusField(item.id, "estimated_cost", item.estimated_cost);
                      e.target.select();
                    }}
                    onChange={(e) => handleLocalChange(item.id, "estimated_cost", e.target.value.replace(/[^0-9.]/g, ""))}
                    onBlur={() => handleBlurField(item.id, "estimated_cost")}
                    className="hidden sm:block h-7 text-sm border-0 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-primary/50 rounded w-full"
                  />

                  {/* Desktop: Actual Cost — read-only sum when itemized */}
                  {isItemized ? (
                    <span
                      className="hidden sm:block text-sm text-green-600 p-1 truncate"
                      title="Sum of line items — expand to edit"
                    >
                      {formatCurrency(item.actual_cost)}
                    </span>
                  ) : (
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={getDisplayValue(item.id, "actual_cost", item.actual_cost)}
                      onFocus={(e) => {
                        handleFocusField(item.id, "actual_cost", item.actual_cost);
                        e.target.select();
                      }}
                      onChange={(e) => handleLocalChange(item.id, "actual_cost", e.target.value.replace(/[^0-9.]/g, ""))}
                      onBlur={() => handleBlurField(item.id, "actual_cost")}
                      className="hidden sm:block h-7 text-sm border-0 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-primary/50 rounded text-green-600 w-full"
                    />
                  )}

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Expanded: Itemized Line Items */}
                {isExpanded && (
                  <div className="bg-muted/10 border-t border-border/30 pl-8 pr-3 py-2 space-y-1">
                    {itemLines.map((line) => (
                      <div key={line.id} className="group/line flex items-center gap-2">
                        <CornerDownRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        <Input
                          value={localLineEdits[line.id]?.name ?? line.name}
                          onFocus={() => handleLineFocus(line.id, "name", line.name)}
                          onChange={(e) => handleLineChange(line.id, "name", e.target.value)}
                          onBlur={() => handleLineBlur(line.id, "name")}
                          className="h-7 text-sm border-0 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-primary/50 rounded flex-1"
                        />
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={getLineDisplayValue(line.id, line.amount)}
                          onFocus={(e) => {
                            handleLineFocus(line.id, "amount", line.amount);
                            e.target.select();
                          }}
                          onChange={(e) => handleLineChange(line.id, "amount", e.target.value.replace(/[^0-9.]/g, ""))}
                          onBlur={() => handleLineBlur(line.id, "amount")}
                          className="h-7 text-sm border-0 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-primary/50 rounded text-green-600 w-24 text-right"
                        />
                        <button
                          onClick={() => onDeleteLineItem(line.id)}
                          className="opacity-0 group-hover/line:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {itemLines.length === 0 && addingLineFor !== item.id && (
                      <p className="text-xs text-muted-foreground pl-5 py-1">
                        No line items yet — itemize what you spent on {item.name}.
                      </p>
                    )}

                    {addingLineFor === item.id ? (
                      <div className="flex items-center gap-2 pl-5 pt-1">
                        <Input
                          placeholder="What did you buy?"
                          value={newLine.name}
                          onChange={(e) => setNewLine((prev) => ({ ...prev, name: e.target.value }))}
                          className="h-7 text-sm flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddLine(item.id);
                            if (e.key === "Escape") setAddingLineFor(null);
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="0"
                          value={newLine.amount || ""}
                          onChange={(e) => setNewLine((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                          className="h-7 text-sm w-24"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddLine(item.id);
                            if (e.key === "Escape") setAddingLineFor(null);
                          }}
                        />
                        <Button size="sm" onClick={() => handleAddLine(item.id)} className="h-7 text-xs">Add</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddingLineFor(null)} className="h-7 text-xs">Done</Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setNewLine({ name: "", amount: 0 });
                          setAddingLineFor(item.id);
                        }}
                        className="flex items-center gap-1 pl-5 py-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add line item
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddItem();
                  if (e.key === "Escape") setIsAddingItem(false);
                }}
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
                className="h-8 text-sm w-full sm:w-24"
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

      {/* Revenue Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-medium text-foreground text-sm">Revenue</h3>
          <Button size="sm" variant="ghost" onClick={() => setIsAddingRevenue(true)} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[1fr,120px,32px] gap-2 px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">
          <span>Source</span>
          <span>Amount</span>
          <span></span>
        </div>

        {/* Revenue Items */}
        <div>
          {revenueItems.map((item) => (
            <div
              key={item.id}
              className="group grid grid-cols-1 sm:grid-cols-[1fr,120px,32px] gap-2 px-3 py-2 border-b border-border/50 hover:bg-muted/20 items-center"
            >
              {/* Mobile: Stacked Layout */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground text-sm truncate">{item.name}</span>
                  <button
                    onClick={() => onDeleteRevenueItem(item.id)}
                    className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs text-green-600">{formatCurrency(item.amount)}</span>
              </div>

              {/* Desktop: Source */}
              <Input
                value={localRevenueEdits[item.id]?.name ?? item.name}
                onFocus={() => handleRevenueFocus(item.id, "name", item.name)}
                onChange={(e) => handleRevenueChange(item.id, "name", e.target.value)}
                onBlur={() => handleRevenueBlur(item.id, "name")}
                className="hidden sm:block h-7 text-sm border-0 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-primary/50 rounded"
              />

              {/* Desktop: Amount */}
              <Input
                type="text"
                inputMode="numeric"
                value={getRevenueDisplayValue(item.id, item.amount)}
                onFocus={(e) => {
                  handleRevenueFocus(item.id, "amount", item.amount);
                  e.target.select();
                }}
                onChange={(e) => handleRevenueChange(item.id, "amount", e.target.value.replace(/[^0-9.]/g, ""))}
                onBlur={() => handleRevenueBlur(item.id, "amount")}
                className="hidden sm:block h-7 text-sm border-0 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-primary/50 rounded text-green-600 w-full"
              />

              <button
                onClick={() => onDeleteRevenueItem(item.id)}
                className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Revenue Inline */}
        {isAddingRevenue && (
          <div className="p-3 border-t border-border bg-muted/20">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Revenue source..."
                value={newRevenue.name}
                onChange={(e) => setNewRevenue((prev) => ({ ...prev, name: e.target.value }))}
                className="h-8 text-sm flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddRevenue();
                  if (e.key === "Escape") setIsAddingRevenue(false);
                }}
              />
              <Input
                type="number"
                placeholder="0"
                value={newRevenue.amount || ""}
                onChange={(e) => setNewRevenue((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                className="h-8 text-sm w-full sm:w-28"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddRevenue();
                  if (e.key === "Escape") setIsAddingRevenue(false);
                }}
              />
              <div className="flex gap-1">
                <Button size="sm" onClick={handleAddRevenue} className="h-8 text-xs">Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingRevenue(false)} className="h-8 text-xs">Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {revenueItems.length === 0 && !isAddingRevenue && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No revenue yet. Click "Add" to record ticket sales, sponsorships, and other income.
          </div>
        )}

        {revenueItems.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30 text-sm">
            <span className="font-medium text-foreground">Total Revenue</span>
            <span className="font-bold text-green-600">{formatCurrency(totalRevenue)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BudgetManagerPersisted;
