"use client";

import { useState, useEffect } from "react";
import { Thermometer, Droplets, Sun, Moon, Move, ShieldCheck } from "lucide-react";
import { DataCard } from "@/components/dashboard/data-card";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { HistoricalChart } from "@/components/dashboard/historical-chart";
import { ImageGallery } from "@/components/dashboard/image-gallery";
import type { SensorData } from "@/lib/mock-data";
import { initialSensorData } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [data, setData] = useState<SensorData | null>(initialSensorData);
  const [loading, setLoading] = useState(true);
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsNight(isDark);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkNow = (mutation.target as HTMLElement).classList.contains('dark');
          setIsNight(isDarkNow);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    const timer = setTimeout(() => {
      setData({
        temperature: 26.5,
        tds: 450,
        light: 850,
        motion: false,
        isNight: isDark,
        timestamp: Date.now(),
      });
      setLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (data) {
        setData(currentData => ({...currentData!, isNight: isNight}));
    }
  }, [isNight]);

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
      <div className="p-4 md:p-8 space-y-8">
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
      </div>
    );
  }
  
  if (!data) {
     return (
        <div className="p-4 md:p-8 space-y-8 text-center">
            <p>Waiting for data...</p>
        </div>
    );
  }

  return (
      <main className="p-4 md:p-8 space-y-8">
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
  );
}
