
"use client";

import { useState, useEffect } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/lib/supabase";

const chartConfig = {
  temperature: { label: "Temperature (°C)", color: "hsl(var(--chart-1))" },
  tds: { label: "TDS (ppm)", color: "hsl(var(--chart-2))" },
  light: { label: "Light", color: "hsl(var(--chart-3))" },
};

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
      <CardHeader>
        <CardTitle>Historical Data</CardTitle>
        <CardDescription>Last 50 data points</CardDescription>
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
