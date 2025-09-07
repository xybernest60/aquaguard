
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { FileText, ImageIcon, Shield, Thermometer, Droplets, Sun } from "lucide-react";

interface SecurityEvent {
  id: number;
  timestamp: string;
  motion_detected: boolean;
  day_night: string;
  capture_url: string | null;
}

interface EnvironmentReading {
  id: number;
  timestamp: string;
  temperature: number | null;
  tds: number | null;
  light: number | null;
}

// A simple function to check if a URL is valid and from Supabase
const isValidSupabaseUrl = (url: string | null): url is string => {
    if (!url) return false;
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'https:' && parsedUrl.hostname.endsWith('supabase.co');
    } catch (e) {
        return false;
    }
};

export default function ReportsPage() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [environmentHistory, setEnvironmentHistory] = useState<EnvironmentReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      
      const [securityRes, environmentRes] = await Promise.all([
        supabase
          .from('security')
          .select('*')
          .or('motion_detected.eq.true,capture_url.not.is.null')
          .order('timestamp', { ascending: false })
          .limit(100),
        supabase
          .from('environment')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100)
      ]);

      if (securityRes.data) {
        const validSecurityEvents = securityRes.data.map(event => ({
          ...event,
          capture_url: isValidSupabaseUrl(event.capture_url) ? event.capture_url : null
        }));
        setSecurityEvents(validSecurityEvents);
      }
      if (environmentRes.data) {
        setEnvironmentHistory(environmentRes.data);
      }
      
      setLoading(false);
    };

    fetchAllData();

    const securityChannel = supabase
      .channel('security-reports-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security' }, (payload) => {
        const newEvent = payload.new as SecurityEvent;
        if (isValidSupabaseUrl(newEvent.capture_url) || newEvent.motion_detected) {
            setSecurityEvents(currentEvents => [newEvent, ...currentEvents]);
        }
      })
      .subscribe();
      
    const environmentChannel = supabase
      .channel('environment-reports-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'environment' }, (payload) => {
        setEnvironmentHistory(currentHistory => [payload.new as EnvironmentReading, ...currentHistory]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(securityChannel);
      supabase.removeChannel(environmentChannel);
    };
  }, []);

  return (
    <main className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>System Reports</CardTitle>
          <CardDescription>A detailed history of all security events and environment readings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="security">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="security">Security Events</TabsTrigger>
              <TabsTrigger value="history">System History</TabsTrigger>
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
                          {event.capture_url && isValidSupabaseUrl(event.capture_url) ? (
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
            <TabsContent value="history">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Temperature (°C)</TableHead>
                    <TableHead>TDS (ppm)</TableHead>
                    <TableHead>Light (lux)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">Loading system history...</TableCell>
                    </TableRow>
                  ) : environmentHistory.length > 0 ? (
                    environmentHistory.map((reading) => (
                      <TableRow key={`env-${reading.id}`}>
                        <TableCell>{new Date(reading.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className="gap-1.5 pl-2 pr-3">
                                <Thermometer className="h-4 w-4 text-red-500" />
                                {reading.temperature ?? 'N/A'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="gap-1.5 pl-2 pr-3">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                {reading.tds ?? 'N/A'}
                            </Badge>
                        </TableCell>
                         <TableCell>
                            <Badge variant="outline" className="gap-1.5 pl-2 pr-3">
                                <Sun className="h-4 w-4 text-yellow-500" />
                                {reading.light ?? 'N/A'}
                            </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">No environment readings found.</TableCell>
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
