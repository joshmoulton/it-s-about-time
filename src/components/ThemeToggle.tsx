import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center gap-3 ${className || ""}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Moon className="h-4 w-4" />
        <span>Dark</span>
      </div>
      <Switch
        checked={theme === "light"}
        onCheckedChange={toggleTheme}
        className="data-[state=checked]:bg-primary"
      />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sun className="h-4 w-4" />
        <span>Light</span>
      </div>
    </div>
  );
}