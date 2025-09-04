'use server';

/**
 * @fileOverview Determines the severity of an alert based on temperature, TDS levels, and motion detection.
 *
 * - analyzeAlertSeverity - A function that analyzes alert data and determines its severity.
 * - AlertSeverityInput - The input type for the analyzeAlertSeverity function.
 * - AlertSeverityOutput - The return type for the analyzeAlertSeverity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AlertSeverityInputSchema = z.object({
  temperature: z.number().describe('The water temperature in Celsius.'),
  tds: z.number().describe('The total dissolved solids in ppm.'),
  motionDetected: z.boolean().describe('Whether motion was detected.'),
  isNight: z.boolean().describe('Whether it is night.'),
});
export type AlertSeverityInput = z.infer<typeof AlertSeverityInputSchema>;

const AlertSeverityOutputSchema = z.object({
  severity: z
    .enum(['low', 'medium', 'high'])
    .describe('The severity of the alert.'),
  reason: z.string().describe('The reason for the alert severity.'),
});
export type AlertSeverityOutput = z.infer<typeof AlertSeverityOutputSchema>;

export async function analyzeAlertSeverity(
  input: AlertSeverityInput
): Promise<AlertSeverityOutput> {
  return analyzeAlertSeverityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'alertSeverityPrompt',
  input: {schema: AlertSeverityInputSchema},
  output: {schema: AlertSeverityOutputSchema},
  prompt: `You are an expert system for determining the severity of alerts in a fish farm monitoring system.

  Based on the following factors, determine the severity of the alert (low, medium, or high) and provide a reason for your assessment.

  Factors:
  - Temperature: {{temperature}} Celsius
  - TDS: {{tds}} ppm
  - Motion Detected: {{motionDetected}}
  - Is Night: {{isNight}}

  Consider these guidelines:
  - High Severity: Temperature is critically out of range (below 15°C or above 35°C), TDS is very high (above 700 ppm), and motion is detected at night.
  - Medium Severity: Temperature is moderately out of range (15-20°C or 30-35°C), TDS is high (500-700 ppm), or motion is detected at night.
  - Low Severity: Temperature is slightly out of range (20-25°C or 25-30°C), TDS is slightly high (300-500 ppm), or any single factor is abnormal.

  Provide the severity and reason in the following JSON format:
  { "severity": "...";, "reason": "..." }
  `,
});

const analyzeAlertSeverityFlow = ai.defineFlow(
  {
    name: 'analyzeAlertSeverityFlow',
    inputSchema: AlertSeverityInputSchema,
    outputSchema: AlertSeverityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
