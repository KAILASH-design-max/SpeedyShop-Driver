
'use server';

/**
 * @fileOverview AI-powered earnings forecast for delivery partners.
 *
 * - getEarningsForecast - A function that predicts potential earnings.
 * - GetEarningsForecastInput - The input type for the getEarningsForecast function.
 * - GetEarningsForecastOutput - The return type for the getEarningsForecast function.
 */

import {ai} from '@/ai/genkit';
import { GetEarningsForecastInputSchema, GetEarningsForecastOutputSchema, type GetEarningsForecastInput, type GetEarningsForecastOutput } from '@/types';


export async function getEarningsForecast(
  input: GetEarningsForecastInput
): Promise<GetEarningsForecastOutput> {
  return getEarningsForecastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getEarningsForecastPrompt',
  input: {schema: GetEarningsForecastInputSchema},
  output: {schema: GetEarningsForecastOutputSchema},
  prompt: `You are an expert data analyst for a quick commerce delivery platform. Your task is to provide a motivational earnings forecast for a delivery partner.

  Analyze the following data to predict today's potential earnings:
  - Driver's Average Daily Earnings: {{{averageDailyEarnings}}}
  - Driver's Average Deliveries Per Day: {{{averageDeliveriesPerDay}}}
  - Day of the Week: {{{dayOfWeek}}}
  - Time of Day: {{{timeOfDay}}}
  - Weather Conditions: {{{weather}}}

  Based on this data, provide an estimated earnings range (min and max) for the rest of the day.
  - Earnings are generally higher on weekends (Friday, Saturday, Sunday) and during peak hours (Evening, 12-2 PM).
  - Bad weather (like rain) often increases order volume and potential tips.
  - Use the driver's past performance as a baseline. The forecast should be realistic but optimistic. A reasonable range is +/- 15-25% of their daily average, adjusted for the factors above.

  Also, provide a short, encouraging 'forecastInsight' that explains the prediction.
  For example: "It's a rainy Friday evening! Expect a surge in orders as people are staying in. A great opportunity to boost your earnings."
  or "It's a quiet Tuesday afternoon. While things are steady now, expect them to pick up during the evening dinner rush."

  Return the forecast in the specified JSON format.
  `,
});

const getEarningsForecastFlow = ai.defineFlow(
  {
    name: 'getEarningsForecastFlow',
    inputSchema: GetEarningsForecastInputSchema,
    outputSchema: GetEarningsForecastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
