
"use client";

import { useState, useEffect } from "react";
import { Thermometer, Droplets, Sun, Moon, Move, ShieldCheck } from "lucide-react";
import { DataCard } from "@/components/dashboard/data-card";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { HistoricalChart } from "@/components/dashboard/historical-chart";
import { ImageGallery } from "@/components/dashboard/image-gallery";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

export interface SensorData {
  temperature: number | null;
  tds: number | null;
  light: number | null;
  motion: boolean;
  isNight: boolean;
  timestamp: number | null;
}


export default function DashboardPage() {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Watch for theme changes from layout
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkNow = (mutation.target as HTMLElement).classList.contains('dark');
          setData(currentData => {
            if (!currentData) return null;
            return {...currentData, isNight: isDarkNow };
          });
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    // Fetch initial data - always get the latest record
    const fetchInitialData = async () => {
      setLoading(true);
      const isDark = document.documentElement.classList.contains('dark');

      const { data: environmentData } = await supabase
        .from('environment')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      const { data: securityData } = await supabase
        .from('security')
        .select('motion_detected, day_night')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      const initialIsNight = securityData ? securityData.day_night === 'night' : isDark;

      setData({
        temperature: environmentData?.temperature ?? null,
        tds: environmentData?.tds ?? null,
        light: environmentData?.light ?? null,
        motion: securityData?.motion_detected ?? false,
        isNight: initialIsNight,
        timestamp: environmentData ? new Date(environmentData.timestamp).getTime() : null,
      });

      if (initialIsNight !== isDark) {
          document.documentElement.classList.toggle("dark", initialIsNight);
      }
      
      setLoading(false);
    };

    fetchInitialData();

    // Subscribe to real-time insertions
    const environmentChannel = supabase
      .channel('environment-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'environment' }, (payload) => {
          const newReading = payload.new as any;
          setData(currentData => ({
              ...(currentData!),
              temperature: newReading.temperature,
              tds: newReading.tds,
              light: newReading.light,
              timestamp: new Date(newReading.timestamp).getTime(),
          }));
      })
      .subscribe();
      
    const securityChannel = supabase
      .channel('security-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security' }, (payload) => {
          const newEvent = payload.new as any;
          const isNightFromData = newEvent.day_night === 'night';
          setData(currentData => ({
              ...(currentData!),
              motion: newEvent.motion_detected,
              isNight: isNightFromData,
          }));
          
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
  }, []);

  const getTemperatureStatus = (temp: number | null) => {
    if (temp === null) return "text-muted-foreground";
    if (temp < 20 || temp > 30) return "text-destructive";
    if (temp < 22 || temp > 28) return "text-accent";
    return "text-foreground";
  };
  
  const getTdsStatus = (tds: number | null) => {
    if (tds === null) return "text-muted-foreground";
    if (tds > 600) return "text-destructive";
    if (tds > 500) return "text-accent";
    return "text-foreground";
  };

  if (loading) {
    return (
      <main className="p-4 md:p-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="lg:col-span-2 h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
          <Skeleton className="h-[300px]" />
      </main>
    );
  }
  
  const hasData = data && data.timestamp !== null;

  return (
      <main className="p-4 md:p-8 space-y-8">
        {!hasData && (
           <div className="text-center text-muted-foreground p-8 border border-dashed rounded-lg">
                <p>Waiting for first data sync from your devices...</p>
           </div>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DataCard
            title="Temperature"
            icon={<Thermometer className="h-6 w-6" />}
            value={data?.temperature ?? 'N/A'}
            unit="°C"
            description="Optimal: 22-28°C"
            statusColor={getTemperatureStatus(data?.temperature ?? null)}
          />
          <DataCard
            title="TDS"
            icon={<Droplets className="h-6 w-6" />}
            value={data?.tds ?? 'N/A'}
            unit="ppm"
            description="Optimal: < 500 ppm"
            statusColor={getTdsStatus(data?.tds ?? null)}
          />
          <DataCard
            title="Environment"
            icon={data?.isNight ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
            value={data?.light ?? 'N/A'}
            unit="lux"
            description={`Currently ${data?.isNight ? "Night" : "Day"}`}
          />
          <DataCard
            title="Security"
            icon={data?.motion ? <Move className="h-6 w-6 text-destructive" /> : <ShieldCheck className="h-6 w-6" />}
            value={data?.motion ? "MOTION" : "Clear"}
            unit=""
            description={data?.motion ? "Motion detected!" : "No movement"}
            statusColor={data?.motion ? "text-destructive" : "text-foreground"}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HistoricalChart />
          </div>
          <div className="lg:col-span-1">
            {data && <AlertPanel data={data} />}
          </div>
        </div>

        <div>
          <ImageGallery />
        </div>
      </main>
  );
}
