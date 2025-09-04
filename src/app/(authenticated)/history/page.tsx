
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { FileText, Lightbulb, Shield, Thermometer } from "lucide-react";

interface Log {
  id: number;
  timestamp: string;
  action: string;
  details: any;
}

const actionIcons: { [key: string]: React.ReactElement } = {
  "motion_detected": <Shield className="h-4 w-4" />,
  "day_mode": <Lightbulb className="h-4 w-4" />,
  "night_mode": <Lightbulb className="h-4 w-4" />,
  "temp_alert": <Thermometer className="h-4 w-4" />,
  "default": <FileText className="h-4 w-4" />,
};

const getActionIcon = (action: string) => {
  const actionKey = Object.keys(actionIcons).find(key => action.toLowerCase().includes(key)) || "default";
  return actionIcons[actionKey];
}

const getActionVariant = (action: string) => {
  if (action.toLowerCase().includes('alert') || action.toLowerCase().includes('critical')) {
    return 'destructive';
  }
  if (action.toLowerCase().includes('motion')) {
    return 'secondary';
  }
  return 'default';
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (data) {
        setLogs(data);
      }
      setLoading(false);
    };

    fetchLogs();

    const channel = supabase
      .channel('logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, (payload) => {
        setLogs(currentLogs => [payload.new as Log, ...currentLogs]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>System Event History</CardTitle>
          <CardDescription>A log of all major events recorded by your AquaGuard devices.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Loading historical data...
                  </TableCell>
                </TableRow>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getActionVariant(log.action)} className="gap-1">
                        {getActionIcon(log.action)}
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.details ? (
                         <pre className="text-xs bg-muted p-2 rounded-md">
                           {JSON.stringify(log.details, null, 2)}
                         </pre>
                      ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
