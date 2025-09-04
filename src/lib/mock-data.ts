export interface SensorData {
  temperature: number;
  tds: number;
  light: number;
  motion: boolean;
  isNight: boolean;
  timestamp: number;
}

export interface SecurityImage {
  url: string;
  timestamp: number;
}

const now = Date.now();

export const initialSensorData: SensorData | null = null;

export const securityImages: SecurityImage[] = [];

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
