import { motion } from "framer-motion";
import { Mail, Sparkles } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CheckEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "your email";
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6"
        >
          <Mail className="w-10 h-10 text-primary" />
        </motion.div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Check your email
        </h1>

        {/* Body */}
        <p className="text-muted-foreground text-base leading-relaxed mb-2">
          We sent a confirmation link to
        </p>
        <p className="text-foreground font-semibold text-lg mb-6">{email}</p>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Click the link in the email to confirm your account. Once confirmed,
          you'll be able to log in and start planning your events.
        </p>

        {/* Divider */}
        <div className="border-t border-border mb-8" />

        {/* Actions */}
        <p className="text-sm text-muted-foreground mb-4">
          Already confirmed?
        </p>
        <Button
          className="w-full h-12 rounded-xl"
          onClick={() => navigate("/auth")}
        >
          Go to Login
        </Button>

        <p className="text-xs text-muted-foreground mt-6">
          Can't find the email? Check your spam folder.
        </p>
      </motion.div>
    </div>
  );
};

export default CheckEmail;
