"use client";

import { useState, useEffect } from "react";
import { Thermometer, Droplets, Sun, Moon, Move, ShieldCheck } from "lucide-react";
import { DataCard } from "@/components/dashboard/data-card";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { HistoricalChart } from "@/components/dashboard/historical-chart";
import { ImageGallery } from "@/components/dashboard/image-gallery";
import type { SensorData } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    // Initial theme check
    const isDark = document.documentElement.classList.contains('dark');
    setIsNight(isDark);

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkNow = (mutation.target as HTMLElement).classList.contains('dark');
          setIsNight(isDarkNow);
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    // Fetch initial data
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: environmentData, error } = await supabase
        .from('environment')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      const { data: securityData, error: securityError } = await supabase
        .from('security')
        .select('motion_detected, day_night')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      if (environmentData) {
        const isNightFromData = securityData ? securityData.day_night === 'night' : isDark;
        setData({
          temperature: environmentData.temperature || 0,
          tds: environmentData.tds || 0,
          light: environmentData.light || 0,
          motion: securityData ? securityData.motion_detected : false,
          isNight: isNightFromData,
          timestamp: new Date(environmentData.timestamp).getTime(),
        });
      }
      setLoading(false);
    };

    fetchInitialData();

    // Subscribe to real-time updates
    const environmentChannel = supabase
      .channel('environment-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'environment' }, (payload) => {
          const newReading = payload.new as any;
          setData(currentData => ({
              ...(currentData || { temperature:0, tds: 0, light: 0, motion: false, timestamp: 0 }),
              temperature: newReading.temperature,
              tds: newReading.tds,
              light: newReading.light,
              timestamp: new Date(newReading.timestamp).getTime(),
              isNight: currentData?.isNight ?? isDark,
          }));
      })
      .subscribe();
      
    const securityChannel = supabase
      .channel('security-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security' }, (payload) => {
          const newEvent = payload.new as any;
          const isNightFromData = newEvent.day_night === 'night';
          setData(currentData => ({
              ...(currentData!),
              motion: newEvent.motion_detected,
              isNight: isNightFromData,
          }));
          
          // Also update the app theme if night/day changes
          if (isNightFromData !== document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.toggle("dark", isNightFromData);
          }
      })
      .subscribe();


    return () => {
      supabase.removeChannel(environmentChannel);
      supabase.removeChannel(securityChannel);
      observer.disconnect();
    };
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
            <p>Waiting for data from your devices...</p>
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
