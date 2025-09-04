import { Fish, Moon, Settings, Sun } from "lucide-react";
import { Button } from "../ui/button";

interface DashboardHeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function DashboardHeader({ theme, toggleTheme }: DashboardHeaderProps) {
  const isNight = theme === 'dark';

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b p-4 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Fish className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground font-headline">
            AquaGuard Dashboard
          </h1>
        </div>
        <Button variant="ghost" onClick={toggleTheme} className="flex items-center gap-2 text-muted-foreground">
          {isNight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span className="text-sm font-medium">
            {isNight ? 'Night Mode' : 'Light Mode'}
          </span>
        </Button>
      </div>
    </header>
  );
}
