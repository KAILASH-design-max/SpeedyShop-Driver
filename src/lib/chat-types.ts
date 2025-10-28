
import { z } from 'genkit';

export const chatHistorySchema = z.object({
  role: z.enum(['user', 'model']),
  message: z.string(),
});

export type ChatHistory = z.infer<typeof chatHistorySchema>;
