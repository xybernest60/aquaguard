"use client";

import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Thermometer, Droplets, Sun, Moon, Move, ShieldCheck } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DataCard } from "@/components/dashboard/data-card";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { HistoricalChart } from "@/components/dashboard/historical-chart";
import { ImageGallery } from "@/components/dashboard/image-gallery";
import type { SensorData } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sensorDataRef = ref(database, 'sensorData');
    
    const unsubscribe = onValue(sensorDataRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        // The ESP32 might send strings, so we ensure types are correct
        const parsedData: SensorData = {
          temperature: parseFloat(rawData.temperature) || 0,
          tds: parseInt(rawData.tds, 10) || 0,
          light: parseInt(rawData.light, 10) || 0,
          motion: !!rawData.motion,
          isNight: (parseInt(rawData.light, 10) || 0) < 400,
          timestamp: rawData.timestamp || Date.now(),
        };
        setData(parsedData);
      } else {
        // Handle case where data doesn't exist yet
        setData(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase read failed: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
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

  if (loading) {
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
  
  if (!data) {
     return (
      <div className="flex flex-col min-h-screen bg-background font-body">
        <DashboardHeader />
        <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8 text-center">
            <p>Waiting for data from your devices...</p>
            <p>Make sure your ESP32 is sending data to the 'sensorData' path in your Firebase Realtime Database.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <DashboardHeader isNight={data?.isNight} />
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
