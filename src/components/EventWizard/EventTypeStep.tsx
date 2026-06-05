import { motion } from "framer-motion";
import { Users, Sparkles, Target, Zap, Network } from "lucide-react";

interface EventTypeStepProps {
  selectedType: string | null;
  onSelect: (type: string) => void;
}

const eventTypes = [
  { id: "mastermind", label: "Mastermind", icon: Users, description: "Small group intensive" },
  { id: "fulfillment", label: "Fulfillment Event", icon: Sparkles, description: "Deliver your promise" },
  { id: "acquisition", label: "Acquisition Event", icon: Target, description: "Attract new clients" },
  { id: "activation", label: "Activation Event", icon: Zap, description: "Energize your audience" },
  { id: "networking", label: "Networking Event", icon: Network, description: "Build connections" },
];

const EventTypeStep = ({ selectedType, onSelect }: EventTypeStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-2">
        Let's build your{" "}
        <span className="text-primary">next event</span>
      </h1>
      <p className="text-muted-foreground text-lg mb-12">
        Select the type of event you're dreaming up.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
        {eventTypes.map((type, index) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;

          return (
            <motion.button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-accent shadow-card-hover"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-card"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-foreground text-sm mb-1">{type.label}</h3>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default EventTypeStep;
