
"use client";

import { useEffect, useState } from "react";
import type { SensorData } from "@/app/(authenticated)/dashboard/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

interface AlertPanelProps {
  data: SensorData;
}

type AlertState = {
  severity: 'low' | 'medium' | 'high';
  title: string;
  reason: string;
} | null;


const severityConfig = {
  low: {
    variant: "default",
    icon: <Info className="h-4 w-4" />,
    title: "Low Severity Alert",
  },
  medium: {
    variant: "default",
    icon: <AlertTriangle className="h-4 w-4 text-accent" />,
    title: "Medium Severity Alert",
  },
  high: {
    variant: "destructive",
    icon: <ShieldAlert className="h-4 w-4" />,
    title: "High Severity Alert",
  },
};

export function AlertPanel({ data }: AlertPanelProps) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!data || data.timestamp === null) {
      setAlert(null);
      return;
    }
    
    // Simplified rule-based alerts based on ESP32 logic
    const intruder = data.motion && data.isNight;
    const tdsTooHigh = data.tds !== null && data.tds > 600;

    if (intruder) {
        setAlert({
            severity: "high",
            title: "High Severity Alert",
            reason: "Motion detected at night!",
        });
    } else if (tdsTooHigh) {
        setAlert({
            severity: "medium",
            title: "Medium Severity Alert",
            reason: "Warning: High TDS Level!",
        });
    } else {
        setAlert(null); // All normal
    }

  }, [data]);

  const config = alert ? severityConfig[alert.severity] : null;

  return (
    <Card className="h-full bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 animate-spin" />
            <span>Analyzing sensor data...</span>
          </div>
        ) : alert && config ? (
          <Alert variant={config.variant} className={alert.severity === 'medium' ? 'bg-accent/10 border-accent/50' : ''}>
            {config.icon}
            <AlertTitle className={alert.severity === 'medium' ? 'text-accent' : ''}>{alert.title}</AlertTitle>
            <AlertDescription>{alert.reason}</AlertDescription>
          </Alert>
        ) : (
          <div className="flex items-center text-muted-foreground">
            <Info className="h-4 w-4 mr-2" />
            <p>All systems normal.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
