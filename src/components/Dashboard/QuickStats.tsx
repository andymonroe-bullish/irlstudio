import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, Users } from "lucide-react";

const stats = [
  {
    label: "Tasks Completed",
    value: "0",
    total: "19",
    icon: CheckCircle2,
    color: "text-phase-afterglow",
    bgColor: "bg-phase-afterglow/10",
  },
  {
    label: "In Progress",
    value: "0",
    icon: Clock,
    color: "text-phase-build",
    bgColor: "bg-phase-build/10",
  },
  {
    label: "Pending Items",
    value: "4",
    icon: AlertCircle,
    color: "text-phase-design",
    bgColor: "bg-phase-design/10",
  },
  {
    label: "Team Members",
    value: "1",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const QuickStats = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-foreground">
                {stat.value}
              </span>
              {stat.total && (
                <span className="text-sm text-muted-foreground">
                  /{stat.total}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default QuickStats;
