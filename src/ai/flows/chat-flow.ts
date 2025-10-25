
'use server';

/**
 * @fileOverview A customer support chat AI agent.
 *
 * This file defines a Genkit flow for a conversational AI that acts as a
 * customer support agent for the "SpeedyDelivery" application.
 *
 * - chat - A function that takes the chat history and a new message and returns an AI-generated response.
 * - ChatHistory - The type representing a single message in the chat history.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { chatHistorySchema } from '@/lib/chat-types';
import type { ChatHistory } from '@/lib/chat-types';

export { type ChatHistory };

const ChatInputSchema = z.object({
  history: z.array(chatHistorySchema),
  message: z.string(),
  orderId: z.string().optional().describe("The ID of the order the user is asking about, if any.")
});

export async function chat(history: ChatHistory[], message: string, orderId?: string): Promise<string> {
  const response = await chatFlow({ history, message, orderId });
  return response.response;
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.object({ response: z.string() }),
  },
  async ({ history, message, orderId }) => {
    const prompt = `You are a friendly and helpful customer support agent for a delivery driver app called "SpeedyDelivery".

    Your role is to assist drivers with their questions and concerns. Keep your responses concise and to the point.
    
    If the user asks about a specific order (the orderId will be provided), use that context in your response. The current order ID is: ${orderId || 'Not specified'}.

    Here is the conversation history:
    ${history
      .map((entry) => `${entry.role === 'user' ? 'Driver' : 'Support'}: ${entry.message}`)
      .join('\n')}

    New message from the driver:
    Driver: ${message}

    Your response:`;

    const llmResponse = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.0-flash',
      config: {
        temperature: 0.7,
      },
    });

    return { response: llmResponse.text };
  }
);
