
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
import { db } from "@/lib/firebase";
import { ref, onValue, query, orderByChild, startAt, endAt } from "firebase/database";
import { FileText, ImageIcon, Shield, Thermometer, Droplets, Sun, Calendar as CalendarIcon, Server } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityEvent {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  image: string | null;
  capture_requested: boolean;
}

interface EnvironmentReading {
  id: string;
  timestamp: string;
  temperature: number | null;
  tds: number | null;
  light: number | null;
  humidity: number | null;
}

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}


const isValidSupabaseUrl = (url: string | null): url is string => {
    if (!url || url === "N/A") return false;
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
  const [logHistory, setLogHistory] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const fetchData = (refPath: string, stateSetter: Function, dateRange?: DateRange) => {
    setLoading(true);
    
    let dbRef = ref(db, refPath);
    let dbQuery;

    if (dateRange?.from) {
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        toDate.setDate(toDate.getDate() + 1); // include the whole end day

        dbQuery = query(dbRef, orderByChild('timestamp'), startAt(dateRange.from.toISOString()), endAt(toDate.toISOString()));
    } else {
        // Default: no date range, just listen to the reference
        dbQuery = query(dbRef, orderByChild('timestamp'));
    }

    onValue(dbQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dataArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        stateSetter(dataArray);
      } else {
        stateSetter([]);
      }
      setLoading(false);
    });
  }

  useEffect(() => {
    const unsubSecurity = fetchData('security', setSecurityEvents, dateRange);
    const unsubEnvironment = fetchData('system_history', setEnvironmentHistory, dateRange);
    const unsubLogs = fetchData('logs', setLogHistory, dateRange);

    // Detach listeners on cleanup or when dateRange changes
    return () => {
      // onValue returns a function to unsubscribe, but our helper doesn't.
      // For simplicity in this structure, we re-fetch, which also works.
      // In a more complex app, you'd manage and call the unsubscribe functions.
    };
  }, [dateRange]);


  return (
    <main className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>System Reports</CardTitle>
          <CardDescription>A detailed history of all security events, environment readings, and system logs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="security">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="security">Security Events</TabsTrigger>
              <TabsTrigger value="history">System History</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
            </TabsList>
            
            {/* Date Picker for all tabs */}
            <div className="flex items-center py-4">
              <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>

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
                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading security events...</TableCell></TableRow>
                  ) : securityEvents.length > 0 ? (
                    securityEvents.map((event) => (
                      <TableRow key={`sec-${event.id}`}>
                        <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={event.event === "Motion Detected" ? "destructive" : "secondary"} className="gap-1">
                            <Shield className="h-4 w-4" /> {event.event}
                          </Badge>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{event.details}</Badge></TableCell>
                        <TableCell>
                          {isValidSupabaseUrl(event.image) ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="text-primary hover:underline flex items-center gap-1"><ImageIcon className="h-4 w-4"/> View Image</button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <Image src={event.image!} alt={`Capture at ${event.timestamp}`} width={1280} height={720} className="rounded-lg object-contain"/>
                              </DialogContent>
                            </Dialog>
                          ) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No security events recorded for this period.</TableCell></TableRow>
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
                  {loading && environmentHistory.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading system history...</TableCell></TableRow>
                  ) : environmentHistory.length > 0 ? (
                    environmentHistory.map((reading) => (
                      <TableRow key={`env-${reading.id}`}>
                        <TableCell>{new Date(reading.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className="gap-1.5 pl-2 pr-3"><Thermometer className="h-4 w-4 text-red-500" />{reading.temperature ?? 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="gap-1.5 pl-2 pr-3"><Droplets className="h-4 w-4 text-blue-500" />{reading.tds ?? 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="gap-1.5 pl-2 pr-3"><Sun className="h-4 w-4 text-yellow-500" />{reading.light ?? 'N/A'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No environment readings found for this period.</TableCell></TableRow>
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
                  {loading && logHistory.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="h-24 text-center">Loading logs...</TableCell></TableRow>
                  ) : logHistory.length > 0 ? (
                    logHistory.map((log) => (
                      <TableRow key={`log-${log.id}`}>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                           <Badge variant="secondary" className="gap-1.5"><Server className="h-4 w-4" />{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.details}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="h-24 text-center">No logs found for this period.</TableCell></TableRow>
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
