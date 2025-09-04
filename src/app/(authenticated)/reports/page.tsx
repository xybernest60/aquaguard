
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { FileText, ImageIcon, Shield, Lightbulb } from "lucide-react";

interface SecurityEvent {
  id: number;
  timestamp: string;
  motion_detected: boolean;
  day_night: string;
  capture_url: string | null;
}

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

export default function ReportsPage() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      
      const [securityRes, logsRes] = await Promise.all([
        supabase
          .from('security')
          .select('*')
          .or('motion_detected.eq.true,capture_url.not.is.null')
          .order('timestamp', { ascending: false })
          .limit(100),
        supabase
          .from('logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100)
      ]);

      if (securityRes.data) {
        setSecurityEvents(securityRes.data);
      }
      if (logsRes.data) {
        setLogs(logsRes.data);
      }
      
      setLoading(false);
    };

    fetchAllData();

    // Note: For a production app, you might want separate channels or a single broadcast channel.
    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security' }, (payload) => {
        setSecurityEvents(currentEvents => [payload.new as SecurityEvent, ...currentEvents]);
      })
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
          <CardTitle>System Reports</CardTitle>
          <CardDescription>A detailed log of all security events and system activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="security">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="security">Security Events</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="security">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Image</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">Loading security events...</TableCell>
                    </TableRow>
                  ) : securityEvents.length > 0 ? (
                    securityEvents.map((event) => (
                      <TableRow key={`sec-${event.id}`}>
                        <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                           {event.motion_detected && <Badge variant="destructive" className="gap-1"><Shield className="h-4 w-4" /> Motion Detected</Badge>}
                           {event.capture_url && !event.motion_detected && <Badge variant="secondary" className="gap-1"><ImageIcon className="h-4 w-4" /> Image Captured</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{event.day_night}</Badge>
                        </TableCell>
                        <TableCell>
                          {event.capture_url ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="text-primary hover:underline flex items-center gap-1">
                                  <ImageIcon className="h-4 w-4"/> View Image
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                  <Image src={event.capture_url} alt={`Capture at ${event.timestamp}`} width={1280} height={720} className="rounded-lg object-contain"/>
                              </DialogContent>
                            </Dialog>
                          ) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">No security events recorded.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="logs">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">Loading system logs...</TableCell>
                    </TableRow>
                  ) : logs.length > 0 ? (
                    logs.map((log) => (
                      <TableRow key={`log-${log.id}`}>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getActionVariant(log.action)} className="gap-1">
                             {getActionIcon(log.action)}
                             {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                           {log.details ? (
                             <pre className="text-xs bg-muted p-2 rounded-md max-w-xs overflow-auto">
                               {JSON.stringify(log.details, null, 2)}
                             </pre>
                           ) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">No system logs found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}

    