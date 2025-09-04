import { Fish } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="bg-card border-b p-4">
      <div className="container mx-auto flex items-center gap-4">
        <Fish className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground font-headline">
          AquaGuard Dashboard
        </h1>
      </div>
    </header>
  );
}
