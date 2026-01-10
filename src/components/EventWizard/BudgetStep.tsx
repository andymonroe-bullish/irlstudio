import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";

interface BudgetStepProps {
  budget: string;
  onBudgetChange: (budget: string) => void;
}

const BudgetStep = ({ budget, onBudgetChange }: BudgetStepProps) => {
  const formatBudget = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers === "") return "";
    return new Intl.NumberFormat("en-US").format(parseInt(numbers));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBudget(e.target.value);
    onBudgetChange(formatted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-2">
        What's your{" "}
        <span className="text-primary">budget?</span>
      </h1>
      <p className="text-muted-foreground text-lg mb-12">
        Let's plan according to your investment.
      </p>

      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <input
            type="text"
            value={budget}
            onChange={handleChange}
            placeholder="Enter your budget"
            className="w-full pl-14 pr-6 py-5 text-2xl font-medium bg-card border-2 border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/50"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Type any amount — we'll help you maximize every dollar.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default BudgetStep;
