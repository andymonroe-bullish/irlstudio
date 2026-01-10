import { useState } from "react";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { BudgetItem, BUDGET_CATEGORIES, getInitialBudgetItems } from "./types";
import BudgetItemRow from "./BudgetItemRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BudgetManagerProps {
  totalBudget: number;
}

const BudgetManager = ({ totalBudget }: BudgetManagerProps) => {
  const [items, setItems] = useState<BudgetItem[]>(getInitialBudgetItems(totalBudget));
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "other",
    estimatedCost: 0,
  });

  const totalEstimated = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalActual = items.reduce((sum, item) => sum + item.actualCost, 0);
  const remaining = totalBudget - totalEstimated;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleUpdateItem = (id: string, updates: Partial<BudgetItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    if (newItem.name.trim()) {
      const today = new Date();
      const dueDate = new Date(today.setMonth(today.getMonth() + 2))
        .toISOString()
        .split("T")[0];

      setItems((prev) => [
        ...prev,
        {
          id: `budget-${Date.now()}`,
          name: newItem.name,
          category: newItem.category,
          estimatedCost: newItem.estimatedCost,
          actualCost: 0,
          dueDate,
          status: "planned",
        },
      ]);
      setNewItem({ name: "", category: "other", estimatedCost: 0 });
      setIsAddingItem(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = Array.from(items);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    setItems(reordered);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl border border-border shadow-card"
    >
      {/* Summary Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Expense Items</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Line items and estimates
            </p>
          </div>
          <Button onClick={() => setIsAddingItem(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Total Budget
            </div>
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(totalBudget)}
            </span>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Estimated
            </div>
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(totalEstimated)}
            </span>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingDown className="w-4 h-4" />
              Actual Spent
            </div>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(totalActual)}
            </span>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4">
            <div className="text-muted-foreground text-sm mb-1">Remaining</div>
            <span
              className={`text-2xl font-bold ${
                remaining >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr,120px,100px,80px,100px,40px] gap-4 items-center py-3 px-4 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span>Item</span>
        <span>Category</span>
        <span>Est. Cost</span>
        <span>Actual</span>
        <span>Due Date</span>
        <span></span>
      </div>

      {/* Items List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="budget-items">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {items.map((item, index) => (
                <BudgetItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Item Form */}
      {isAddingItem && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-4 border-t border-border bg-muted/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Item Name
              </label>
              <Input
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter item name..."
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Category
              </label>
              <Select
                value={newItem.category}
                onValueChange={(value) =>
                  setNewItem((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {BUDGET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Estimated Cost
              </label>
              <Input
                type="number"
                value={newItem.estimatedCost || ""}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    estimatedCost: Number(e.target.value),
                  }))
                }
                placeholder="0"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddItem}>Add</Button>
              <Button variant="ghost" onClick={() => setIsAddingItem(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BudgetManager;
