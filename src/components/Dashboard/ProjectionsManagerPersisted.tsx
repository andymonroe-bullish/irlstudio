import { motion } from "framer-motion";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { RevenueStream } from "@/hooks/useEvents";
import { Input } from "@/components/ui/input";

interface ProjectionsManagerPersistedProps {
  totalBudget: number;
  streams: RevenueStream[];
  onUpdateStream: (id: string, updates: Partial<RevenueStream>) => Promise<void>;
  onAddStream: () => Promise<void>;
  onDeleteStream: (id: string) => Promise<void>;
}

const ProjectionsManagerPersisted = ({
  totalBudget,
  streams,
  onUpdateStream,
  onAddStream,
  onDeleteStream,
}: ProjectionsManagerPersistedProps) => {
  const totalRevenue = streams.reduce(
    (sum, stream) => sum + stream.price * stream.projected_volume,
    0
  );
  const projectedProfit = totalRevenue - totalBudget;
  const roi = totalBudget > 0 ? totalRevenue / totalBudget : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const maxBarValue = Math.max(totalBudget, totalRevenue);
  const budgetHeight = maxBarValue > 0 ? (totalBudget / maxBarValue) * 100 : 0;
  const revenueHeight = maxBarValue > 0 ? (totalRevenue / maxBarValue) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Revenue & Projections
          </h2>
          <p className="text-muted-foreground mt-1">
            Track your model from prediction to profit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Streams Table */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">
              Projected Revenue Streams
            </h3>
            <span className="px-3 py-1.5 bg-muted rounded-lg text-xs font-medium text-muted-foreground">
              PLANNING MODE
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left pb-4 font-medium">Stream Name</th>
                  <th className="text-right pb-4 font-medium">Price</th>
                  <th className="text-center pb-4 font-medium">Proj. Vol</th>
                  <th className="text-right pb-4 font-medium">Total</th>
                  <th className="w-10 pb-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {streams.map((stream) => (
                  <tr key={stream.id} className="group">
                    <td className="py-4">
                      <Input
                        value={stream.name}
                        onChange={(e) =>
                          onUpdateStream(stream.id, { name: e.target.value })
                        }
                        className="border-0 bg-transparent p-0 h-auto font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={stream.price}
                          onChange={(e) =>
                            onUpdateStream(stream.id, {
                              price: parseInt(e.target.value) || 0,
                            })
                          }
                          className="border-0 bg-transparent p-0 h-auto w-20 text-right focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex justify-center">
                        <Input
                          type="number"
                          value={stream.projected_volume}
                          onChange={(e) =>
                            onUpdateStream(stream.id, {
                              projected_volume: parseInt(e.target.value) || 0,
                            })
                          }
                          className="border-0 bg-primary/10 rounded-lg p-2 h-auto w-16 text-center text-primary font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </td>
                    <td className="py-4 text-right font-medium text-primary">
                      {formatCurrency(stream.price * stream.projected_volume)}
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => onDeleteStream(stream.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={onAddStream}
            className="flex items-center gap-2 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Revenue Model
          </button>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Projected Profit */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <p className="text-sm text-muted-foreground mb-1">Projected Profit</p>
            <p
              className={`text-3xl font-bold ${
                projectedProfit >= 0 ? "text-primary" : "text-destructive"
              }`}
            >
              {formatCurrency(projectedProfit)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Revenue - Budget</p>
          </div>

          {/* Projected ROI */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
            <p className="text-sm opacity-80 mb-1">Projected ROI</p>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-bold">{roi.toFixed(1)}x</p>
              <TrendingUp className="w-6 h-6 opacity-60" />
            </div>
            <p className="text-sm opacity-80 mt-1">Revenue Multiplier</p>
          </div>

          {/* Budget vs Revenue Chart */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h4 className="font-semibold text-foreground mb-4">Budget vs Revenue</h4>
            <div className="flex items-end justify-center gap-8 h-32">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-16 bg-destructive/80 rounded-t-lg transition-all duration-300"
                  style={{ height: `${budgetHeight}%`, minHeight: "8px" }}
                />
                <span className="text-xs text-muted-foreground">Budget (Cost)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-16 bg-primary rounded-t-lg transition-all duration-300"
                  style={{ height: `${revenueHeight}%`, minHeight: "8px" }}
                />
                <span className="text-xs text-muted-foreground">Proj. Revenue</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectionsManagerPersisted;