import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Copy,
  FlaskConical,
  DollarSign,
  TrendingUp,
  Pencil,
} from "lucide-react";
import { BudgetItem, RevenueItem } from "@/hooks/useEvents";
import {
  useBudgetScenarios,
  ScenarioBudgetItem,
  ScenarioRevenueItem,
} from "@/hooks/useBudgetScenarios";
import { BUDGET_CATEGORIES } from "./types";
import PerAttendeeBudget from "./PerAttendeeBudget";
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

interface MockBudgetsPersistedProps {
  eventId: string;
  liveItems: BudgetItem[];
  liveRevenueItems: RevenueItem[];
  attendeeCount: number | null;
  onUpdateAttendees: (count: number) => Promise<void>;
}

type LocalItemEdits = Record<string, { name?: string; estimated_cost?: string }>;
type LocalRevenueEdits = Record<string, { name?: string; amount?: string }>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const MockBudgetsPersisted = ({
  eventId,
  liveItems,
  liveRevenueItems,
  attendeeCount,
  onUpdateAttendees,
}: MockBudgetsPersistedProps) => {
  const {
    scenarios, scenarioItems, scenarioRevenues, loading,
    createScenario, renameScenario, deleteScenario, duplicateScenario,
    addScenarioItem, updateScenarioItem, deleteScenarioItem,
    addScenarioRevenue, updateScenarioRevenue, deleteScenarioRevenue,
  } = useBudgetScenarios(eventId);

  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "other", estimatedCost: 0 });
  const [isAddingRevenue, setIsAddingRevenue] = useState(false);
  const [newRevenue, setNewRevenue] = useState({ name: "", amount: 0 });

  // Local editing state — only synced to DB on blur
  const [localEdits, setLocalEdits] = useState<LocalItemEdits>({});
  const [localRevenueEdits, setLocalRevenueEdits] = useState<LocalRevenueEdits>({});

  // Default to the first scenario once loaded
  const activeScenario =
    scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0] ?? null;

  const items = activeScenario
    ? scenarioItems.filter((i) => i.scenario_id === activeScenario.id)
    : [];
  const revenues = activeScenario
    ? scenarioRevenues.filter((r) => r.scenario_id === activeScenario.id)
    : [];

  const totalCost = items.reduce((sum, i) => sum + Number(i.estimated_cost), 0);
  const totalRevenue = revenues.reduce((sum, r) => sum + Number(r.amount), 0);
  const profit = totalRevenue - totalCost;

  // Live budget comparison
  const liveEstimatedTotal = liveItems.reduce((sum, i) => sum + (i.estimated_cost || 0), 0);
  const costDelta = totalCost - liveEstimatedTotal;

  const getCategoryColor = (categoryId: string) =>
    BUDGET_CATEGORIES.find((c) => c.id === categoryId)?.color || "bg-muted text-muted-foreground";
  const getCategoryName = (categoryId: string) =>
    BUDGET_CATEGORIES.find((c) => c.id === categoryId)?.name || categoryId;

  const handleCreate = async (copyFromLive: boolean) => {
    const name = newScenarioName.trim() || "New Scenario";
    const scenario = await createScenario(
      name,
      copyFromLive
        ? {
            items: liveItems.map((i) => ({
              name: i.name,
              category: i.category,
              estimated_cost: i.estimated_cost,
            })),
            revenues: liveRevenueItems.map((r) => ({ name: r.name, amount: r.amount })),
          }
        : undefined
    );
    if (scenario) {
      setActiveScenarioId(scenario.id);
      setIsCreating(false);
      setNewScenarioName("");
    }
  };

  const handleDuplicate = async () => {
    if (!activeScenario) return;
    const copy = await duplicateScenario(activeScenario.id);
    if (copy) setActiveScenarioId(copy.id);
  };

  const handleDelete = async () => {
    if (!activeScenario) return;
    await deleteScenario(activeScenario.id);
    setActiveScenarioId(null);
    setConfirmingDelete(false);
  };

  const handleRename = async () => {
    if (activeScenario && renameValue.trim()) {
      await renameScenario(activeScenario.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleAddItem = () => {
    if (activeScenario && newItem.name.trim()) {
      addScenarioItem(activeScenario.id, {
        name: newItem.name.trim(),
        category: newItem.category,
        estimated_cost: newItem.estimatedCost,
      });
      setNewItem({ name: "", category: "other", estimatedCost: 0 });
      // Keep the form open so several expenses can be sketched in a row
    }
  };

  const handleAddRevenue = () => {
    if (activeScenario && newRevenue.name.trim()) {
      addScenarioRevenue(activeScenario.id, {
        name: newRevenue.name.trim(),
        amount: newRevenue.amount,
      });
      setNewRevenue({ name: "", amount: 0 });
    }
  };

  // Expense rows use the same edit-locally-then-sync-on-blur pattern as the live budget
  const getItemDisplayValue = (item: ScenarioBudgetItem) => {
    const localVal = localEdits[item.id]?.estimated_cost;
    if (localVal !== undefined) return localVal;
    return formatCurrency(Number(item.estimated_cost));
  };

  const handleItemFocus = (itemId: string, field: "name" | "estimated_cost", dbValue: string | number) => {
    setLocalEdits((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: String(dbValue) } }));
  };

  const handleItemChange = (itemId: string, field: "name" | "estimated_cost", value: string) => {
    setLocalEdits((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  };

  const handleItemBlur = (itemId: string, field: "name" | "estimated_cost") => {
    const localVal = localEdits[itemId]?.[field];
    if (localVal === undefined) return;
    const updates: Partial<ScenarioBudgetItem> = {};
    if (field === "name") updates.name = localVal;
    if (field === "estimated_cost") updates.estimated_cost = parseFloat(localVal) || 0;
    updateScenarioItem(itemId, updates);
    setLocalEdits((prev) => {
      const next = { ...prev };
      if (next[itemId]) {
        const updated = { ...next[itemId] };
        delete updated[field];
        if (Object.keys(updated).length === 0) delete next[itemId];
        else next[itemId] = updated;
      }
      return next;
    });
  };

  const getRevenueDisplayValue = (item: ScenarioRevenueItem) => {
    const localVal = localRevenueEdits[item.id]?.amount;
    if (localVal !== undefined) return localVal;
    return formatCurrency(Number(item.amount));
  };

  const handleRevenueFocus = (itemId: string, field: "name" | "amount", dbValue: string | number) => {
    setLocalRevenueEdits((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: String(dbValue) } }));
  };

  const handleRevenueChange = (itemId: string, field: "name" | "amount", value: string) => {
    setLocalRevenueEdits((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  };

  const handleRevenueBlur = (itemId: string, field: "name" | "amount") => {
    const localVal = localRevenueEdits[itemId]?.[field];
    if (localVal === undefined) return;
    const updates: Partial<ScenarioRevenueItem> = {};
    if (field === "name") updates.name = localVal;
    if (field === "amount") updates.amount = parseFloat(localVal) || 0;
    updateScenarioRevenue(itemId, updates);
    setLocalRevenueEdits((prev) => {
      const next = { ...prev };
      if (next[itemId]) {
        const updated = { ...next[itemId] };
        delete updated[field];
        if (Object.keys(updated).length === 0) delete next[itemId];
        else next[itemId] = updated;
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading mock budgets...</div>
      </div>
    );
  }

  // Empty state: no scenarios yet
  if (scenarios.length === 0 && !isCreating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-10 text-center"
      >
        <FlaskConical className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-semibold text-foreground mb-1">No mock budgets yet</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
          Sketch "what if" versions of your budget — a lean version, a premium version, a
          different venue — without touching your live numbers.
        </p>
        <Button onClick={() => setIsCreating(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Create your first mock budget
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      {/* Scenario Picker */}
      <div className="flex items-center gap-2 flex-wrap">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => {
              setActiveScenarioId(scenario.id);
              setIsRenaming(false);
              setConfirmingDelete(false);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
              activeScenario?.id === scenario.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {scenario.name}
          </button>
        ))}
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-all"
        >
          <Plus className="w-3 h-3" />
          New
        </button>
      </div>

      {/* Create Scenario Form */}
      {isCreating && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-medium text-foreground text-sm mb-3">New mock budget</h3>
          <Input
            placeholder='Scenario name — e.g. "Lean version" or "200 attendees"'
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            className="h-9 text-sm mb-3"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate(false);
              if (e.key === "Escape") setIsCreating(false);
            }}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="sm" onClick={() => handleCreate(false)} className="h-8 text-xs">
              Start blank
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCreate(true)}
              className="h-8 text-xs gap-1"
              disabled={liveItems.length === 0 && liveRevenueItems.length === 0}
            >
              <Copy className="w-3 h-3" />
              Copy from live budget
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setNewScenarioName("");
              }}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {activeScenario && (
        <>
          {/* Scenario Header: name + actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <FlaskConical className="w-4 h-4 text-primary shrink-0" />
              {isRenaming ? (
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") setIsRenaming(false);
                  }}
                  className="h-8 text-sm w-56"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setRenameValue(activeScenario.name);
                    setIsRenaming(true);
                  }}
                  className="group flex items-center gap-1.5 min-w-0"
                  title="Rename scenario"
                >
                  <h3 className="font-semibold text-foreground truncate">{activeScenario.name}</h3>
                  <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={handleDuplicate} className="h-7 text-xs gap-1">
                <Copy className="w-3 h-3" />
                Duplicate
              </Button>
              {confirmingDelete ? (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="destructive" onClick={handleDelete} className="h-7 text-xs">
                    Delete scenario
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)} className="h-7 text-xs">
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmingDelete(true)}
                  className="h-7 text-xs gap-1 hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Per-Attendee Budget */}
          <PerAttendeeBudget
            label="Per-Attendee Budget"
            totalAmount={totalCost}
            totalLabel="projected cost"
            attendeeCount={attendeeCount}
            onUpdateAttendees={onUpdateAttendees}
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="w-3 h-3" />
                Projected Cost
              </div>
              <span className="text-2xl font-bold text-foreground">{formatCurrency(totalCost)}</span>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                Projected Revenue
              </div>
              <span className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="text-muted-foreground text-xs mb-1">Projected Profit</div>
              <span className={cn("text-2xl font-bold", profit < 0 ? "text-destructive" : "text-green-600")}>
                {formatCurrency(profit)}
              </span>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="text-muted-foreground text-xs mb-1">vs. Live Budget</div>
              <span
                className={cn(
                  "text-2xl font-bold",
                  costDelta > 0 ? "text-destructive" : costDelta < 0 ? "text-green-600" : "text-foreground"
                )}
              >
                {costDelta > 0 ? "+" : ""}
                {formatCurrency(costDelta)}
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                cost vs. {formatCurrency(liveEstimatedTotal)} live estimate
              </p>
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

            <div className="hidden sm:grid grid-cols-[1fr,110px,110px,32px] gap-2 px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">
              <span>Item</span>
              <span>Category</span>
              <span>Estimated</span>
              <span></span>
            </div>

            <div>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group grid grid-cols-1 sm:grid-cols-[1fr,110px,110px,32px] gap-2 px-3 py-2 border-b border-border/50 hover:bg-muted/20 items-center"
                >
                  {/* Mobile: Stacked Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground text-sm truncate">{item.name}</span>
                      <button
                        onClick={() => deleteScenarioItem(item.id)}
                        className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", getCategoryColor(item.category))}>
                        {getCategoryName(item.category)}
                      </span>
                      <span className="text-muted-foreground">Est: {formatCurrency(Number(item.estimated_cost))}</span>
                    </div>
                  </div>

                  {/* Desktop: Name */}
                  <Input
                    value={localEdits[item.id]?.name ?? item.name}
                    onFocus={() => handleItemFocus(item.id, "name", item.name)}
                    onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                    onBlur={() => handleItemBlur(item.id, "name")}
                    className="hidden sm:block h-7 text-sm border-0 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-primary/50 rounded"
                  />

                  {/* Desktop: Category */}
                  <Select
                    value={item.category}
                    onValueChange={(v) => updateScenarioItem(item.id, { category: v })}
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
                    value={getItemDisplayValue(item)}
                    onFocus={(e) => {
                      handleItemFocus(item.id, "estimated_cost", item.estimated_cost);
                      e.target.select();
                    }}
                    onChange={(e) => handleItemChange(item.id, "estimated_cost", e.target.value.replace(/[^0-9.]/g, ""))}
                    onBlur={() => handleItemBlur(item.id, "estimated_cost")}
                    className="hidden sm:block h-7 text-sm border-0 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-primary/50 rounded w-full"
                  />

                  <button
                    onClick={() => deleteScenarioItem(item.id)}
                    className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddItem();
                      if (e.key === "Escape") setIsAddingItem(false);
                    }}
                  />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={handleAddItem} className="h-8 text-xs">Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingItem(false)} className="h-8 text-xs">Done</Button>
                  </div>
                </div>
              </div>
            )}

            {items.length === 0 && !isAddingItem && (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No expenses in this scenario yet. Click "Add" to sketch one.
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

            <div className="hidden sm:grid grid-cols-[1fr,120px,32px] gap-2 px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">
              <span>Source</span>
              <span>Amount</span>
              <span></span>
            </div>

            <div>
              {revenues.map((item) => (
                <div
                  key={item.id}
                  className="group grid grid-cols-1 sm:grid-cols-[1fr,120px,32px] gap-2 px-3 py-2 border-b border-border/50 hover:bg-muted/20 items-center"
                >
                  {/* Mobile: Stacked Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground text-sm truncate">{item.name}</span>
                      <button
                        onClick={() => deleteScenarioRevenue(item.id)}
                        className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs text-green-600">{formatCurrency(Number(item.amount))}</span>
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
                    value={getRevenueDisplayValue(item)}
                    onFocus={(e) => {
                      handleRevenueFocus(item.id, "amount", item.amount);
                      e.target.select();
                    }}
                    onChange={(e) => handleRevenueChange(item.id, "amount", e.target.value.replace(/[^0-9.]/g, ""))}
                    onBlur={() => handleRevenueBlur(item.id, "amount")}
                    className="hidden sm:block h-7 text-sm border-0 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-primary/50 rounded text-green-600 w-full"
                  />

                  <button
                    onClick={() => deleteScenarioRevenue(item.id)}
                    className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

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
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingRevenue(false)} className="h-8 text-xs">Done</Button>
                  </div>
                </div>
              </div>
            )}

            {revenues.length === 0 && !isAddingRevenue && (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No revenue in this scenario yet. Click "Add" to model ticket sales, sponsorships, and other income.
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default MockBudgetsPersisted;
