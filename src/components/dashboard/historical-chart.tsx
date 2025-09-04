"use client";

import { useState, useEffect } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { visualizeHistoricalData, type VisualizeHistoricalDataOutput } from "@/ai/flows/historical-data-visualizer";
import { Bot } from "lucide-react";
import { supabase } from "@/lib/supabase";

const chartConfig = {
  temperature: { label: "Temperature (°C)", color: "hsl(var(--chart-1))" },
  tds: { label: "TDS (ppm)", color: "hsl(var(--chart-2))" },
  light: { label: "Light", color: "hsl(var(--chart-3))" },
};

const formSchema = z.object({
  sensorType: z.string().min(1, "Please select a sensor type."),
  timeRange: z.string().min(1, "Please select a time range."),
  goal: z.string().min(1, "Please select a goal."),
});

function VisualizationHelper({ dataPoints }: { dataPoints: number }) {
  const [suggestion, setSuggestion] = useState<VisualizeHistoricalDataOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { sensorType: "", timeRange: "", goal: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await visualizeHistoricalData({
        ...values,
        dataPoints,
      });
      setSuggestion(result);
    } catch (error) {
      console.error("Error fetching visualization suggestion:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bot className="mr-2 h-4 w-4" />
          AI Visualization Helper
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Visualization Helper</DialogTitle>
          <DialogDescription>Let AI suggest the best way to visualize your data.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sensorType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sensor Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a sensor" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="tds">TDS</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Range</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a time range" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="last day">Last Day</SelectItem>
                      <SelectItem value="last week">Last Week</SelectItem>
                      <SelectItem value="last month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visualization Goal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a goal" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="identify trends">Identify Trends</SelectItem>
                      <SelectItem value="find anomalies">Find Anomalies</SelectItem>
                      <SelectItem value="daily summary">Daily Summary</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Thinking..." : "Get Suggestion"}
            </Button>
          </form>
        </Form>
        {suggestion && (
          <div className="mt-4 space-y-2 rounded-lg border bg-secondary/50 p-4">
            <h4 className="font-semibold">Suggestion:</h4>
            <p className="text-sm"><strong>Chart Type:</strong> {suggestion.chartType}</p>
            <p className="text-sm"><strong>Timescale:</strong> {suggestion.timescale}</p>
            <p className="text-sm"><strong>Aggregation:</strong> {suggestion.dataAggregation}</p>
            <p className="text-sm mt-2 pt-2 border-t"><strong>Reasoning:</strong> {suggestion.reasoning}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function HistoricalChart() {
    const [historicalData, setHistoricalData] = useState<any[]>([]);

    useEffect(() => {
        const fetchHistoricalData = async () => {
            const { data, error } = await supabase
                .from('environment')
                .select('timestamp, temperature, tds, light')
                .order('timestamp', { ascending: false })
                .limit(50); // Fetch last 50 data points

            if (data) {
                const formattedData = data.map(item => ({
                    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    temperature: item.temperature,
                    tds: item.tds,
                    light: item.light,
                })).reverse(); // reverse to show oldest first
                setHistoricalData(formattedData);
            }
        };

        fetchHistoricalData();

        const channel = supabase
            .channel('historical-environment-changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'environment' }, (payload) => {
                const newItem = {
                    time: new Date(payload.new.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    temperature: payload.new.temperature,
                    tds: payload.new.tds,
                    light: payload.new.light,
                };
                setHistoricalData(currentData => [...currentData.slice(-49), newItem]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, []);

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Historical Data</CardTitle>
          <CardDescription>Last 50 data points</CardDescription>
        </div>
        <VisualizationHelper dataPoints={historicalData.length} />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="temperature">
          <TabsList>
            <TabsTrigger value="temperature">Temperature</TabsTrigger>
            <TabsTrigger value="tds">TDS</TabsTrigger>
            <TabsTrigger value="light">Light</TabsTrigger>
          </TabsList>
          <TabsContent value="temperature">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={historicalData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Line dataKey="temperature" type="monotone" stroke={chartConfig.temperature.color} strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="tds">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={historicalData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Line dataKey="tds" type="monotone" stroke={chartConfig.tds.color} strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="light">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={historicalData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Line dataKey="light" type="monotone" stroke={chartConfig.light.color} strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
