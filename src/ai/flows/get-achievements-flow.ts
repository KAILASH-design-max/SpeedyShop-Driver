
'use server';

/**
 * @fileOverview AI-powered achievement generation for drivers.
 *
 * - getAchievements - A function that generates a personalized list of achievements based on driver performance.
 * - GetAchievementsInput - The input type for the getAchievements function.
 * - GetAchievementsOutput - The return type for the getAchievements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetAchievementsInputSchema = z.object({
  totalDeliveries: z.number().describe('The total number of deliveries the driver has ever completed.'),
  deliveriesToday: z.number().describe('The number of deliveries completed today.'),
  peakHourDeliveries: z.number().describe('The number of deliveries completed during peak hours (5-9 PM) this week.'),
  weekendDeliveries: z.number().describe('The number of deliveries completed over the last weekend.'),
  lateNightDeliveries: z.number().describe('The number of deliveries completed after 10 PM this month.'),
  overallRating: z.number().describe('The driver\'s average overall rating out of 5.'),
  fiveStarRatingStreak: z.number().describe('The current number of consecutive 5-star ratings.'),
});
export type GetAchievementsInput = z.infer<typeof GetAchievementsInputSchema>;

const AchievementSchema = z.object({
  title: z.string().describe('The catchy title of the achievement.'),
  description: z.string().describe('A brief description of what the driver needs to do.'),
  reward: z.string().describe('The reward for completing the achievement (e.g., "₹100 Bonus", "Profile Badge").'),
  progress: z.number().describe('The driver\'s current progress towards the target.'),
  target: z.number().describe('The target value to complete the achievement.'),
  status: z.enum(['In Progress', 'Completed', 'Locked']).describe('The current status of the achievement.'),
  icon: z.enum(['Target', 'Trophy', 'Zap', 'Star', 'Lock', 'Moon', 'Sun']).describe('The icon to display for the achievement.'),
});

const GetAchievementsOutputSchema = z.object({
  achievements: z.array(AchievementSchema),
});

export type GetAchievementsOutput = z.infer<typeof GetAchievementsOutputSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;


export async function getAchievements(
  input: GetAchievementsInput
): Promise<GetAchievementsOutput> {
  return getAchievementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getAchievementsPrompt',
  input: {schema: GetAchievementsInputSchema},
  output: {schema: GetAchievementsOutputSchema},
  prompt: `You are an AI assistant that generates a personalized list of achievements for a delivery driver based on their performance data.

  Driver Performance Data:
  - Total Deliveries: {{{totalDeliveries}}}
  - Deliveries Today: {{{deliveriesToday}}}
  - Peak Hour Deliveries (this week, 5-9 PM): {{{peakHourDeliveries}}}
  - Weekend Deliveries (last weekend): {{{weekendDeliveries}}}
  - Late Night Deliveries (this month, after 10 PM): {{{lateNightDeliveries}}}
  - Overall Rating: {{{overallRating}}}/5
  - 5-Star Rating Streak: {{{fiveStarRatingStreak}}}

  Generate a list of 5-6 relevant achievements. The achievements should be a mix of short-term and long-term goals, and should feel like dynamic bonuses.
  - Base the 'progress' and 'status' of each achievement on the provided performance data.
  - If a driver has made no progress on a difficult achievement, mark it as 'Locked'.
  - Ensure the 'icon' matches the achievement's theme. Use 'Target' for delivery count goals, 'Trophy' for major milestones, 'Zap' for time-based goals like peak hours, 'Star' for rating goals, 'Moon' for late-night goals, 'Sun' for weekend goals, and 'Lock' for locked achievements.

  Here are some example achievements to adapt. Create a varied and engaging list.

  - "Complete 10 Deliveries Today": Target: 10, Progress: {{{deliveriesToday}}}
  - "5-Star Rating Streak": Target: 5, Progress: {{{fiveStarRatingStreak}}}
  - "Peak Hour Power": Target: 5 (for the week), Progress: {{{peakHourDeliveries}}}, Reward: "₹50 Bonus"
  - "Weekend Warrior": Target: 25 (for the weekend), Progress: {{{weekendDeliveries}}}, Reward: "₹200 Bonus"
  - "Night Owl": Target: 10 (for the month), Progress: {{{lateNightDeliveries}}}. Mark as Locked if progress is 0. Reward: "₹150 Bonus"
  - "Delivery Pro": Target: 100 total deliveries, Progress: {{{totalDeliveries}}}

  Return a list of achievements in the specified JSON format.
  `,
});

const getAchievementsFlow = ai.defineFlow(
  {
    name: 'getAchievementsFlow',
    inputSchema: GetAchievementsInputSchema,
    outputSchema: GetAchievementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
