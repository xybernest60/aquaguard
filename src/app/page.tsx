"use client";

import { useState, useEffect } from "react";
import { Thermometer, Droplets, Sun, Moon, Move, ShieldCheck } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DataCard } from "@/components/dashboard/data-card";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { HistoricalChart } from "@/components/dashboard/historical-chart";
import { ImageGallery } from "@/components/dashboard/image-gallery";
import type { SensorData } from "@/lib/mock-data";
import { initialSensorData, historicalData as mockHistoricalData } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";

type Theme = "light" | "dark";

export default function Home() {
  const [data, setData] = useState<SensorData | null>(initialSensorData);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Set initial theme based on system preference
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setData({
        temperature: 26.5,
        tds: 450,
        light: 850,
        motion: false,
        isNight: theme === 'dark',
        timestamp: Date.now(),
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [theme]);

  const getTemperatureStatus = (temp: number) => {
    if (temp < 20 || temp > 30) return "text-destructive";
    if (temp < 22 || temp > 28) return "text-accent";
    return "text-foreground";
  };
  
  const getTdsStatus = (tds: number) => {
    if (tds > 600) return "text-destructive";
    if (tds > 500) return "text-accent";
    return "text-foreground";
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen font-body">
        <DashboardHeader theme={theme} toggleTheme={toggleTheme} />
        <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="md:col-span-2 h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
          <Skeleton className="h-[300px]" />
        </main>
      </div>
    );
  }
  
  if (!data) {
     return (
      <div className="flex flex-col min-h-screen font-body">
        <DashboardHeader theme={theme} toggleTheme={toggleTheme} />
        <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8 text-center">
            <p>Waiting for data...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-body">
      <DashboardHeader theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DataCard
            title="Temperature"
            icon={<Thermometer className="h-6 w-6" />}
            value={data.temperature}
            unit="°C"
            description="Optimal: 22-28°C"
            statusColor={getTemperatureStatus(data.temperature)}
          />
          <DataCard
            title="TDS"
            icon={<Droplets className="h-6 w-6" />}
            value={data.tds}
            unit="ppm"
            description="Optimal: < 500 ppm"
            statusColor={getTdsStatus(data.tds)}
          />
          <DataCard
            title="Environment"
            icon={data.isNight ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
            value={data.light}
            unit="lux"
            description={`Currently ${data.isNight ? "Night" : "Day"}`}
          />
          <DataCard
            title="Security"
            icon={data.motion ? <Move className="h-6 w-6 text-destructive" /> : <ShieldCheck className="h-6 w-6" />}
            value={data.motion ? "MOTION" : "Clear"}
            unit=""
            description={data.motion ? "Motion detected!" : "No movement"}
            statusColor={data.motion ? "text-destructive" : "text-foreground"}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HistoricalChart />
          </div>
          <div className="lg:col-span-1">
            <AlertPanel data={data} />
          </div>
        </div>

        <div>
          <ImageGallery />
        </div>
      </main>
    </div>
  );
}
