import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AuthConfirmed = () => {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    // Supabase automatically processes the token hash and creates a session.
    // We just need to detect that session.
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setConfirmed(true);
      }
    };

    // Listen for the auth event in case the hash is still being processed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setConfirmed(true);
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-green-100 mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-600" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-foreground mb-3"
        >
          Email confirmed!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-base leading-relaxed mb-8"
        >
          Your account is verified and ready to go. Log in to start planning
          your events.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            className="w-full h-12 rounded-xl"
            onClick={() => navigate(confirmed ? "/" : "/auth")}
          >
            {confirmed ? "Go to Dashboard" : "Log In"}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthConfirmed;
