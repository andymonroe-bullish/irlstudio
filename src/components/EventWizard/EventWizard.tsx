import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { DateRange } from "react-day-picker";
import StepIndicator from "./StepIndicator";
import EventTypeStep from "./EventTypeStep";
import BudgetStep from "./BudgetStep";
import DateStep from "./DateStep";
import { Button } from "@/components/ui/button";

interface EventWizardProps {
  onComplete: (data: {
    eventType: string;
    budget: string;
    dateRange: DateRange;
  }) => void;
}

const EventWizard = ({ onComplete }: EventWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [eventType, setEventType] = useState<string | null>(null);
  const [budget, setBudget] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return eventType !== null;
      case 1:
        return budget.length > 0;
      case 2:
        return dateRange?.from !== undefined;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (eventType && budget && dateRange?.from) {
      onComplete({
        eventType,
        budget,
        dateRange: dateRange as DateRange,
      });
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <StepIndicator currentStep={currentStep} totalSteps={3} />

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <EventTypeStep
              key="step-0"
              selectedType={eventType}
              onSelect={setEventType}
            />
          )}
          {currentStep === 1 && (
            <BudgetStep
              key="step-1"
              budget={budget}
              onBudgetChange={setBudget}
            />
          )}
          {currentStep === 2 && (
            <DateStep
              key="step-2"
              dateRange={dateRange}
              onDateChange={setDateRange}
            />
          )}
        </AnimatePresence>

        <motion.div
          className="flex justify-center gap-4 mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {currentStep > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="px-6 rounded-xl border-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {currentStep < 2 ? (
            <Button
              size="lg"
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleComplete}
              disabled={!canProceed()}
              className="px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Build My Event
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EventWizard;
