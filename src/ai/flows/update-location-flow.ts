
'use server';

/**
 * @fileOverview Flow for updating a driver's live location for a specific order.
 *
 * - updateLocation - A function that receives and stores a driver's GPS coordinates for an order.
 * - UpdateLocationInput - The input type for the updateLocation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, GeoPoint, Timestamp } from 'firebase-admin/firestore';

const UpdateLocationInputSchema = z.object({
  orderId: z.string().describe("The ID of the order being tracked."),
  latitude: z.number().describe("The driver's current latitude."),
  longitude: z.number().describe("The driver's current longitude."),
});
export type UpdateLocationInput = z.infer<typeof UpdateLocationInputSchema>;

// This flow doesn't need to return anything complex.
const UpdateLocationOutputSchema = z.object({
  success: z.boolean(),
});
export type UpdateLocationOutput = z.infer<typeof UpdateLocationOutputSchema>;


export async function updateLocation(
  input: UpdateLocationInput
): Promise<UpdateLocationOutput> {
  return updateLocationFlow(input);
}


const updateLocationFlow = ai.defineFlow(
  {
    name: 'updateLocationFlow',
    inputSchema: UpdateLocationInputSchema,
    outputSchema: UpdateLocationOutputSchema,
  },
  async (input) => {
    try {
        const db = getFirestore();
        // Use a new collection 'deliveryLocations' and the orderId as the document ID
        const locationRef = db.collection('deliveryLocations').doc(input.orderId);
        
        await locationRef.set({
            latitude: input.latitude,
            longitude: input.longitude,
            timestamp: Timestamp.now(),
        }, { merge: true });

        return { success: true };

    } catch (error) {
        console.error("Failed to update delivery location:", error);
        // In a production app, you might have more robust error handling here.
        return { success: false };
    }
  }
);
