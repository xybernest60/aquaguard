// src/ai/flows/historical-data-visualizer.ts
'use server';

/**
 * @fileOverview A Genkit flow to suggest visualization parameters for historical sensor data.
 *
 * - visualizeHistoricalData - A function that suggests visualization parameters.
 * - VisualizeHistoricalDataInput - The input type for the visualizeHistoricalData function.
 * - VisualizeHistoricalDataOutput - The return type for the visualizeHistoricalData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VisualizeHistoricalDataInputSchema = z.object({
  sensorType: z.string().describe('The type of sensor data (e.g., temperature, TDS, light, motion).'),
  timeRange: z.string().describe('The time range for the data (e.g., last day, last week, last month).'),
  dataPoints: z.number().describe('The number of data points available for the given time range.'),
  goal: z.string().describe('The goal of visualization (e.g., identify trends, find anomalies).'),
});
export type VisualizeHistoricalDataInput = z.infer<typeof VisualizeHistoricalDataInputSchema>;

const VisualizeHistoricalDataOutputSchema = z.object({
  timescale: z.string().describe('The suggested timescale for the visualization (e.g., hourly, daily, weekly).'),
  dataAggregation: z.string().describe('The suggested data aggregation method (e.g., average, sum, min/max).'),
  chartType: z.string().describe('The suggested chart type for the visualization (e.g., line chart, bar chart, scatter plot).'),
  reasoning: z.string().describe('The reasoning behind the suggested parameters.'),
});
export type VisualizeHistoricalDataOutput = z.infer<typeof VisualizeHistoricalDataOutputSchema>;

export async function visualizeHistoricalData(input: VisualizeHistoricalDataInput): Promise<VisualizeHistoricalDataOutput> {
  return visualizeHistoricalDataFlow(input);
}

const visualizeHistoricalDataPrompt = ai.definePrompt({
  name: 'visualizeHistoricalDataPrompt',
  input: {schema: VisualizeHistoricalDataInputSchema},
  output: {schema: VisualizeHistoricalDataOutputSchema},
  prompt: `You are an expert data visualization consultant. Given the following information about historical sensor data, suggest appropriate visualization parameters.

Sensor Type: {{{sensorType}}}
Time Range: {{{timeRange}}}
Number of Data Points: {{{dataPoints}}}
Visualization Goal: {{{goal}}}

Consider the following factors when making your suggestions:

*   The timescale should be appropriate for the time range and the number of data points.  If there are a large number of data points over a short time range, a smaller timescale (e.g., hourly) may be appropriate.  If there are a small number of data points over a long time range, a larger timescale (e.g., weekly) may be appropriate.
*   The data aggregation method should be appropriate for the sensor type and the visualization goal. For sensor readings like temperature or light, averaging might be appropriate. For event counts like motion detection, summing might be better.
*   The chart type should effectively convey the data and help achieve the visualization goal. Line charts are good for showing trends over time. Bar charts are good for comparing values between categories. Scatter plots are good for showing the relationship between two variables.

Suggest a timescale, data aggregation method, and chart type, and explain your reasoning.`, 
});

const visualizeHistoricalDataFlow = ai.defineFlow(
  {
    name: 'visualizeHistoricalDataFlow',
    inputSchema: VisualizeHistoricalDataInputSchema,
    outputSchema: VisualizeHistoricalDataOutputSchema,
  },
  async input => {
    const {output} = await visualizeHistoricalDataPrompt(input);
    return output!;
  }
);
