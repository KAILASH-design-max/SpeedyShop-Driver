
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
  description: z.string().describe('A brief description of what the driver needs to do to complete the achievement.'),
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
  prompt: `You are an AI assistant that generates a personalized list of achievements for a delivery driver based on their performance data. Create a list of 5-6 engaging challenges.

  Driver Performance Data:
  - Total Deliveries (All-Time): {{{totalDeliveries}}}
  - Deliveries Completed Today: {{{deliveriesToday}}}
  - Peak Hour Deliveries (This Week, 5-9 PM): {{{peakHourDeliveries}}}
  - Weekend Deliveries (Last Weekend): {{{weekendDeliveries}}}
  - Late Night Deliveries (This Month, after 10 PM): {{{lateNightDeliveries}}}
  - Overall Rating (out of 5): {{{overallRating}}}
  - Current 5-Star Rating Streak: {{{fiveStarRatingStreak}}}

  Your Task:
  Generate a list of 5-6 relevant achievements. The achievements should feel like dynamic bonuses and challenges.
  - Base the 'progress' and 'status' of each achievement on the provided performance data. An achievement is 'Completed' if progress >= target.
  - If a driver has made no progress on a difficult achievement, mark it as 'Locked'.
  - Ensure the 'icon' matches the achievement's theme. Use 'Target' for delivery count goals, 'Trophy' for major milestones, 'Zap' for time-based goals like peak hours, 'Star' for rating goals, 'Moon' for late-night goals, 'Sun' for weekend goals, and 'Lock' for locked achievements.
  - Make the rewards compelling (e.g., ₹50 Bonus, ₹100 Bonus).

  Example Achievements to Adapt (Create a varied and engaging list based on these ideas):
  1.  "Daily Dasher":
      - Description: "Complete 10 deliveries today."
      - Progress: {{{deliveriesToday}}}
      - Target: 10
      - Reward: "₹50 Bonus"
      - Icon: Target
  2.  "Five-Star Finisher":
      - Description: "Maintain a streak of 5 five-star ratings."
      - Progress: {{{fiveStarRatingStreak}}}
      - Target: 5
      - Reward: "Gold Star Badge"
      - Icon: Star
  3.  "Peak Hour Power":
      - Description: "Complete 15 deliveries during peak hours this week."
      - Progress: {{{peakHourDeliveries}}}
      - Target: 15
      - Reward: "₹150 Bonus"
      - Icon: Zap
  4.  "Weekend Warrior":
      - Description: "Complete 25 deliveries over the weekend."
      - Progress: {{{weekendDeliveries}}}
      - Target: 25
      - Reward: "₹200 Bonus"
      - Icon: Sun
  5.  "Night Owl Ninja":
      - Description: "Complete 10 late-night deliveries this month."
      - Progress: {{{lateNightDeliveries}}}
      - Target: 10
      - Reward: "₹150 Bonus"
      - Icon: Moon (or Lock if progress is 0)
  6.  "Delivery Pro":
      - Description: "Reach a milestone of 100 total deliveries."
      - Progress: {{{totalDeliveries}}}
      - Target: 100
      - Reward: "Pro Badge"
      - Icon: Trophy

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
