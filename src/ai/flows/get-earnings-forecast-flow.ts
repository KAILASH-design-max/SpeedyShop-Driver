'use server';

/**
 * @fileOverview AI-powered earnings forecast for delivery partners.
 *
 * - getEarningsForecast - A function that predicts potential earnings.
 * - GetEarningsForecastInput - The input type for the getEarningsForecast function.
 * - GetEarningsForecastOutput - The return type for the getEarningsForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GetEarningsForecastInputSchema = z.object({
  dayOfWeek: z.string().describe("The current day of the week (e.g., 'Monday', 'Friday')."),
  timeOfDay: z.string().describe("The current time of day (e.g., 'Morning', 'Afternoon', 'Evening', 'Late Night')."),
  averageDailyEarnings: z.number().describe("The driver's average earnings per day over the last month."),
  averageDeliveriesPerDay: z.number().describe("The driver's average number of deliveries per day over the last month."),
  weather: z.string().optional().describe("Optional current weather conditions (e.g., 'Rainy', 'Clear')."),
});
export type GetEarningsForecastInput = z.infer<typeof GetEarningsForecastInputSchema>;

export const GetEarningsForecastOutputSchema = z.object({
  estimatedEarningsRange: z.object({
    min: z.number().describe('The minimum potential earnings for the day.'),
    max: z.number().describe('The maximum potential earnings for the day.'),
  }),
  forecastInsight: z.string().describe("A brief, encouraging insight about the forecast, explaining why it might be higher or lower than average."),
});
export type GetEarningsForecastOutput = z.infer<typeof GetEarningsForecastOutputSchema>;


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
