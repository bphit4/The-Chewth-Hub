import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <Button
      data-testid="button-theme-toggle"
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="h-8 w-8 border-white/25 bg-white/5 text-white shadow-sm hover:border-primary hover:bg-white/10 hover:text-white focus-visible:ring-primary"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
