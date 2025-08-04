'use server';

/**
 * @fileOverview Flow for updating a driver's live location.
 *
 * - updateLocation - A function that receives and stores a driver's GPS coordinates.
 * - UpdateLocationInput - The input type for the updateLocation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, GeoPoint, Timestamp } from 'firebase-admin/firestore';

const UpdateLocationInputSchema = z.object({
  driverId: z.string().describe("The unique ID of the driver."),
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
        const locationRef = db.collection('driverLocations').doc(input.driverId);
        
        await locationRef.set({
            lastKnownLocation: new GeoPoint(input.latitude, input.longitude),
            updatedAt: Timestamp.now(),
            driverId: input.driverId,
        }, { merge: true });

        return { success: true };

    } catch (error) {
        console.error("Failed to update driver location:", error);
        // In a production app, you might have more robust error handling here.
        return { success: false };
    }
  }
);
