
import type { SensorData } from "@/app/(authenticated)/dashboard/page";

export interface SecurityImage {
  url: string;
  timestamp: number;
}

const now = Date.now();

export const initialSensorData: SensorData | null = null;

export const securityImages: SecurityImage[] = [
    { url: "https://picsum.photos/600/400?random=1", timestamp: now - 1000 * 60 * 5 },
    { url: "https://picsum.photos/600/400?random=2", timestamp: now - 1000 * 60 * 10 },
    { url: "https://picsum.photos/600/400?random=3", timestamp: now - 1000 * 60 * 15 },
    { url: "https://picsum.photos/600/400?random=4", timestamp: now - 1000 * 60 * 20 },
    { url: "https://picsum.photos/600/400?random=5", timestamp: now - 1000 * 60 * 25 },
];


const generateHistoricalData = (numPoints: number) => {
  const data = [];
  let temp = 25;
  let tds = 400;
  let light = 800;

  for (let i = 0; i < numPoints; i++) {
    const timestamp = now - (numPoints - i) * 1000 * 60 * 15; // 15 min intervals
    temp += (Math.random() - 0.5) * 0.5;
    tds += (Math.random() - 0.5) * 10;
    light += (Math.random() - 0.5) * 50;

    data.push({
      time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: parseFloat(temp.toFixed(1)),
      tds: Math.round(tds),
      light: Math.round(light),
    });
  }
  return data;
};


export const historicalData = generateHistoricalData(50);
