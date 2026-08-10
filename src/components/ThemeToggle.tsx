import { Moon, Sun } from "lucide-react";
import { useThemePreference } from "@/hooks/useThemePreference";
import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
  const { resolvedTheme, saveTheme } = useThemePreference();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => saveTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="hidden sm:inline">{isDark ? "Light Mode" : "Dark Mode"}</span>
    </Button>
  );
};

export default ThemeToggle;
