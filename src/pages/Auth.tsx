import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ── Friendly error messages ──────────────────────────────────────────────────
const friendlyError = (message: string): string => {
  if (message.includes("Invalid login credentials"))
    return "Email or password is incorrect. Please try again.";
  if (message.includes("Email not confirmed"))
    return "Please confirm your email before logging in. Check your inbox.";
  if (message.includes("already registered") || message.includes("already been registered"))
    return "An account with this email already exists. Try logging in instead.";
  if (message.includes("Password should be at least"))
    return "Password must be at least 6 characters.";
  if (message.includes("Unable to validate email address"))
    return "Please enter a valid email address.";
  if (message.includes("signup_disabled"))
    return "Sign ups are temporarily disabled. Please try again later.";
  if (message.includes("rate limit") || message.includes("too many requests"))
    return "Too many attempts. Please wait a moment and try again.";
  return message;
};

// ── Password strength ─────────────────────────────────────────────────────────
const getPasswordStrength = (password: string) => {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "bg-destructive", width: "w-1/4", textColor: "text-destructive" };
  if (score <= 2) return { label: "Fair", color: "bg-orange-400", width: "w-2/4", textColor: "text-orange-500" };
  if (score <= 3) return { label: "Good", color: "bg-yellow-400", width: "w-3/4", textColor: "text-yellow-600" };
  return { label: "Strong", color: "bg-green-500", width: "w-full", textColor: "text-green-600" };
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const passwordStrength = !isLogin ? getPasswordStrength(password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({ title: "Welcome back!" });
        navigate("/");
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        // With email auto-confirm enabled, signup returns a session right away
        // and the user can go straight in. If confirmation is ever re-enabled,
        // there is no session yet and we fall back to the check-email page.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          toast({ title: "Welcome to IRL Event Studio!" });
          navigate("/");
        } else {
          navigate(`/check-email?email=${encodeURIComponent(email)}`);
        }
      }
    } catch (error: any) {
      toast({
        title: isLogin ? "Couldn't sign in" : "Couldn't create account",
        description: friendlyError(error.message),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (error: any) {
      toast({ title: "Error", description: friendlyError(error.message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password view ──────────────────────────────────────────────────
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/20 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Reset your password</h1>
            <p className="text-muted-foreground mt-2">Enter your email and we'll send you a reset link.</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
            {resetSent ? (
              <div className="text-center space-y-4">
                <p className="text-foreground font-medium">Check your inbox!</p>
                <p className="text-sm text-muted-foreground">
                  We sent a password reset link to <strong>{resetEmail}</strong>.
                </p>
                <Button className="w-full" onClick={() => { setShowForgotPassword(false); setResetSent(false); }}>
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl">
                  {loading ? "Sending…" : "Send Reset Link"}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to login
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main auth view ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin
              ? "Sign in to keep building your IRL events"
              : "Start planning amazing events today"}
          </p>
        </div>

        {/* Auth Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-8 shadow-card"
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name (signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password strength (signup only) */}
              {!isLogin && password && passwordStrength && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1.5 pt-1"
                >
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full transition-all duration-300", passwordStrength.color)}
                      initial={{ width: 0 }}
                      animate={{ width: passwordStrength.width.replace("w-", "").replace("1/4", "25%").replace("2/4", "50%").replace("3/4", "75%").replace("full", "100%") }}
                      style={{
                        width: passwordStrength.width === "w-1/4" ? "25%"
                          : passwordStrength.width === "w-2/4" ? "50%"
                          : passwordStrength.width === "w-3/4" ? "75%"
                          : "100%"
                      }}
                    />
                  </div>
                  <p className={cn("text-xs font-medium", passwordStrength.textColor)}>
                    {passwordStrength.label} password
                    {passwordStrength.label === "Weak" && " — try adding numbers or symbols"}
                    {passwordStrength.label === "Fair" && " — try adding uppercase letters"}
                  </p>
                </motion.div>
              )}

              {/* Forgot password link (login only) */}
              {isLogin && (
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setResetEmail(email); }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isLogin ? "Signing in…" : "Creating account…"}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Toggle login/signup */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setPassword(""); setShowPassword(false); }}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
