import { motion } from "framer-motion";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator = ({ currentStep, totalSteps }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <motion.div
          key={index}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            index === currentStep
              ? "w-8 bg-primary"
              : index < currentStep
              ? "w-6 bg-primary/60"
              : "w-6 bg-muted"
          }`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        />
      ))}
    </div>
  );
};

export default StepIndicator;
