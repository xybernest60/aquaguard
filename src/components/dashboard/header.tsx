import { Fish, Settings } from "lucide-react";

interface DashboardHeaderProps {
  isNight?: boolean;
}

export function DashboardHeader({ isNight }: DashboardHeaderProps) {
  return (
    <header className="bg-card border-b p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Fish className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground font-headline">
            AquaGuard Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">
            {typeof isNight === 'undefined' ? 'Loading...' : isNight ? 'Night Mode' : 'Light Mode'}
          </span>
        </div>
      </div>
    </header>
  );
}
