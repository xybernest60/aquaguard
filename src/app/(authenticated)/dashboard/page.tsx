
"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { Thermometer, Droplets, Sun, Moon, Move, ShieldCheck } from "lucide-react";
import { DataCard } from "@/components/dashboard/data-card";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { HistoricalChart } from "@/components/dashboard/historical-chart";
import { ImageGallery } from "@/components/dashboard/image-gallery";
import { Skeleton } from "@/components/ui/skeleton";

export interface SensorData {
  temperature: number | null;
  tds: number | null;
  light: number | null;
  motion: boolean;
  isNight: boolean;
  timestamp: number | null;
}

const DEVICE_ID = "aquaguard_main"; // As defined in ESP32 code

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

    // Listener for current environment data
    const systemCurrentRef = ref(db, `system_current/${DEVICE_ID}`);
    const environmentListener = onValue(systemCurrentRef, (snapshot) => {
      const dbData = snapshot.val();
      if (dbData) {
        setData(currentData => ({
          ...(currentData ?? { motion: false, isNight: false }),
          temperature: dbData.temperature ?? null,
          tds: dbData.tds ?? null,
          light: dbData.light ?? null,
          timestamp: dbData.timestamp ? new Date(dbData.timestamp).getTime() : Date.now(),
        }));
      }
      setLoading(false);
    });

    // Listener for security data (motion & day/night)
    // ESP32 code shows security events are PUSHED (new records) not PUT (overwrite)
    // so we listen to the parent path and get the latest
     const securityRef = ref(db, 'security');
     const securityListener = onValue(securityRef, (snapshot) => {
         const securityEvents = snapshot.val();
         if (securityEvents) {
            const latestEventKey = Object.keys(securityEvents).sort().pop();
            if(latestEventKey) {
                const latestEvent = securityEvents[latestEventKey];
                const isNightFromData = latestEvent.details === 'night';
                
                setData(currentData => ({
                    ...(currentData ?? { temperature: null, tds: null, light: null, timestamp: null }),
                    motion: latestEvent.event === 'Motion Detected',
                    isNight: isNightFromData,
                }));
                
                if (isNightFromData !== document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.toggle("dark", isNightFromData);
                }
            }
         }
     });


    return () => {
      environmentListener(); // Detach listener
      securityListener();
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
