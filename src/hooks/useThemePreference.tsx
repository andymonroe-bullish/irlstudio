import { useEffect } from "react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Module-level so multiple hook instances (toggle button + global sync)
// only fetch the saved preference once per signed-in user.
let syncedUserId: string | null = null;

/**
 * Account-backed theme preference. The saved value in the user's profile is
 * the source of truth; next-themes' localStorage entry acts as the
 * instant-apply cache so there's no flash while the profile loads.
 */
export const useThemePreference = () => {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (!user || syncedUserId === user.id) return;
    syncedUserId = user.id;
    // Generated Supabase types are stale (no theme_preference), hence the cast.
    (supabase.from("profiles") as any)
      .select("theme_preference")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: { theme_preference?: string } | null }) => {
        const saved = data?.theme_preference;
        if (saved === "light" || saved === "dark") setTheme(saved);
      });
  }, [user, setTheme]);

  const saveTheme = (theme: "light" | "dark") => {
    setTheme(theme);
    if (!user) return;
    (supabase.from("profiles") as any)
      .update({ theme_preference: theme })
      .eq("id", user.id)
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) console.error("Failed to save theme preference:", error.message);
      });
  };

  return { resolvedTheme, saveTheme };
};

/** Mount once inside AuthProvider so the saved theme applies on any page. */
export const ThemePreferenceSync = () => {
  useThemePreference();
  return null;
};
