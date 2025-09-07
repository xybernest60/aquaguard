
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/lib/supabase";
import { FileText, ImageIcon, Shield, Thermometer, Droplets, Sun, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

const isValidSupabaseUrl = (url: string | null): url is string => {
    if (!url) return false;
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname.endsWith('supabase.co');
    } catch (e) {
        return false;
    }
};

function DateRangePicker({
  className,
  date,
  setDate,
}: {
  className?: string;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}


export default function ReportsPage() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [environmentHistory, setEnvironmentHistory] = useState<EnvironmentReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    const fetchSecurityData = async () => {
      const { data } = await supabase
        .from('security')
        .select('*')
        .or('motion_detected.eq.true,capture_url.not.is.null')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (data) {
        const validSecurityEvents = data.map(event => ({
          ...event,
          capture_url: isValidSupabaseUrl(event.capture_url) ? event.capture_url : null
        }));
        setSecurityEvents(validSecurityEvents);
      }
    };

    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([fetchSecurityData(), fetchEnvironmentData()]);
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

    return () => {
      supabase.removeChannel(securityChannel);
    };
  }, []);

  const fetchEnvironmentData = async () => {
      setLoading(true);
      let query = supabase
        .from('environment')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(2000);
      
      if (dateRange?.from) {
        query = query.gte('timestamp', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        // Add a day to the end date to include the whole day
        const toDate = new Date(dateRange.to);
        toDate.setDate(toDate.getDate() + 1);
        query = query.lte('timestamp', toDate.toISOString());
      }

      const { data } = await query;

      if (data) {
        setEnvironmentHistory(data);
      }
      setLoading(false);
    };
    
  useEffect(() => {
    fetchEnvironmentData();

    const environmentChannel = supabase
      .channel('environment-reports-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'environment' }, (payload) => {
        // Re-fetch or append based on date range
         fetchEnvironmentData();
      })
      .subscribe();
      
      return () => {
          supabase.removeChannel(environmentChannel);
      }

  }, [dateRange]);


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
                  {loading && securityEvents.length === 0 ? (
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
             <div className="flex items-center py-4">
                <DateRangePicker date={dateRange} setDate={setDateRange} />
             </div>
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
                      <TableCell colSpan={4} className="h-24 text-center">No environment readings found for the selected period.</TableCell>
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
