'use server';

/**
 * @fileOverview AI-powered route optimization for delivery partners.
 *
 * - optimizeDeliveryRoute - A function that optimizes a delivery route using AI.
 * - OptimizeDeliveryRouteInput - The input type for the optimizeDeliveryRoute function.
 * - OptimizeDeliveryRouteOutput - The return type for the optimizeDeliveryRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeDeliveryRouteInputSchema = z.object({
  currentLocation: z
    .string()
    .describe(
      'Current GPS coordinates of the delivery partner (latitude, longitude).'
    ),
  destinationAddresses: z
    .array(z.string())
    .describe('An array of destination addresses for the deliveries.'),
  trafficConditions: z
    .string()
    .optional()
    .describe('Optional description of current traffic conditions.'),
  weatherConditions: z
    .string()
    .optional()
    .describe('Optional description of current weather conditions.'),
});
export type OptimizeDeliveryRouteInput = z.infer<typeof OptimizeDeliveryRouteInputSchema>;

const OptimizeDeliveryRouteOutputSchema = z.object({
  optimizedRoute: z
    .array(z.string())
    .describe(
      'An array of optimized destination addresses in the order of delivery.'
    ),
  estimatedTime: z
    .string()
    .describe(
      'The estimated time to complete the entire delivery route, in minutes.'
    ),
  routeSummary: z
    .string()
    .describe('A summary of the optimized route, including total distance.'),
});
export type OptimizeDeliveryRouteOutput = z.infer<typeof OptimizeDeliveryRouteOutputSchema>;

export async function optimizeDeliveryRoute(
  input: OptimizeDeliveryRouteInput
): Promise<OptimizeDeliveryRouteOutput> {
  return optimizeDeliveryRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeDeliveryRoutePrompt',
  input: {schema: OptimizeDeliveryRouteInputSchema},
  output: {schema: OptimizeDeliveryRouteOutputSchema},
  prompt: `You are an AI assistant designed to optimize delivery routes for delivery partners.

  Given the delivery partner's current location, a list of destination addresses, and current traffic and weather conditions, you will determine the fastest and most efficient delivery route.

  Current Location: {{{currentLocation}}}
  Destination Addresses: {{#each destinationAddresses}}{{{this}}}, {{/each}}
  Traffic Conditions: {{{trafficConditions}}}
  Weather Conditions: {{{weatherConditions}}}

  Optimize the delivery route considering real-time traffic and weather conditions to minimize delivery time.
  Return the optimized route, estimated time to complete the route, and a summary of the route.
  Ensure the output is well-formatted and easy to understand.
  `,
});

const optimizeDeliveryRouteFlow = ai.defineFlow(
  {
    name: 'optimizeDeliveryRouteFlow',
    inputSchema: OptimizeDeliveryRouteInputSchema,
    outputSchema: OptimizeDeliveryRouteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
