import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, Mail, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { profile, loading, updateFullName } = useProfile();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync the input once the profile loads
  useEffect(() => {
    if (profile) setFullName(profile.full_name || "");
  }, [profile]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await updateFullName(fullName);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
    }
  };

  const dirty = profile ? fullName.trim() !== (profile.full_name || "") : false;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back to events
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Profile Settings</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            Your name is how teammates see you when assigning tasks.
          </p>

          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-card space-y-6">
            {/* Full name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && dirty) handleSave();
                  }}
                  className="pl-10 h-12 rounded-xl"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  value={profile?.email || ""}
                  className="pl-10 h-12 rounded-xl bg-muted/40"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">Your email can't be changed here.</p>
            </div>

            <Button onClick={handleSave} disabled={saving || loading || !dirty} className="gap-2 h-11 rounded-xl">
              {saving ? "Saving…" : <><Check className="w-4 h-4" /> Save Changes</>}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
