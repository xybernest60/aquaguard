"use client";

import { useState, useEffect } from "react";
import { Thermometer, Droplets, Sun, Moon, Move, ShieldCheck } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DataCard } from "@/components/dashboard/data-card";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { HistoricalChart } from "@/components/dashboard/historical-chart";
import { ImageGallery } from "@/components/dashboard/image-gallery";
import { initialSensorData, type SensorData } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [data, setData] = useState<SensorData | null>(null);

  useEffect(() => {
    // Initial load
    setData(initialSensorData);

    // Simulate real-time data updates every 5 seconds
    const interval = setInterval(() => {
      setData((prevData) => {
        if (!prevData) return initialSensorData;
        const newTemp = prevData.temperature + (Math.random() - 0.5) * 0.2;
        const newTds = prevData.tds + (Math.random() - 0.5) * 5;
        const newLight = prevData.light + (Math.random() - 0.5) * 10;
        
        // Occasionally trigger motion
        const newMotion = Math.random() > 0.95;

        return {
          temperature: parseFloat(newTemp.toFixed(1)),
          tds: Math.round(newTds),
          light: Math.round(newLight),
          motion: newMotion,
          isNight: newLight < 400,
          timestamp: Date.now(),
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  if (!data) {
    return (
      <div className="flex flex-col min-h-screen bg-background font-body">
        <DashboardHeader />
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

  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <DashboardHeader />
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
