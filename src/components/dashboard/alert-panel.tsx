"use client";

import { useEffect, useState } from "react";
import type { SensorData } from "@/lib/mock-data";
import { analyzeAlertSeverity, type AlertSeverityOutput } from "@/ai/flows/alert-severity-analyzer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

interface AlertPanelProps {
  data: SensorData;
}

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
  const [alert, setAlert] = useState<AlertSeverityOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAlerts = async () => {
      // Define alert conditions
      const tempOutOfRange = data.temperature < 20 || data.temperature > 30;
      const tdsTooHigh = data.tds > 600;
      const intruder = data.motion && data.isNight;

      if (tempOutOfRange || tdsTooHigh || intruder) {
        setIsLoading(true);
        try {
          const result = await analyzeAlertSeverity({
            temperature: data.temperature,
            tds: data.tds,
            motionDetected: data.motion,
            isNight: data.isNight,
          });
          setAlert(result);
        } catch (error) {
          console.error("Error analyzing alert severity:", error);
          setAlert({
            severity: "medium",
            reason: "Could not analyze alert, operating in failsafe mode."
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setAlert(null);
      }
    };

    checkAlerts();
  }, [data]);

  const config = alert ? severityConfig[alert.severity] : null;

  return (
    <Card className="h-full">
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
            <AlertTitle className={alert.severity === 'medium' ? 'text-accent' : ''}>{config.title}</AlertTitle>
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
