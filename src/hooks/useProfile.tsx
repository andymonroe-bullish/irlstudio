import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

/** The current user's own profile, with an updater for the name. */
export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .eq("user_id", user.id)
        .single();
      setProfile((data as Profile) ?? null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateFullName = async (fullName: string): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error("Not signed in") };
    const trimmed = fullName.trim();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("user_id", user.id);
    if (!error) {
      setProfile((prev) => (prev ? { ...prev, full_name: trimmed } : prev));
    }
    return { error };
  };

  return { profile, loading, updateFullName, refetch: fetchProfile };
};
