
'use server';
/**
 * @fileOverview An AI flow for sending mass notifications to all users.
 *
 * - sendMassNotification - Sends a notification to all registered users.
 * - SendMassNotificationInput - Input type for the function.
 * - SendMassNotificationOutput - Output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAllUserProfiles } from '@/services/userService';
import { addNotification } from '@/services/notificationService';

const SendMassNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification message.'),
  message: z.string().describe('The main content of the notification message.'),
  link: z.string().optional().describe('An optional link to include with the notification.'),
});
export type SendMassNotificationInput = z.infer<typeof SendMassNotificationInputSchema>;

const SendMassNotificationOutputSchema = z.object({
  count: z.number().describe('The number of users notified.'),
});
export type SendMassNotificationOutput = z.infer<typeof SendMassNotificationOutputSchema>;

export async function sendMassNotification(input: SendMassNotificationInput): Promise<SendMassNotificationOutput> {
  return sendMassNotificationFlow(input);
}

const sendMassNotificationFlow = ai.defineFlow(
  {
    name: 'sendMassNotificationFlow',
    inputSchema: SendMassNotificationInputSchema,
    outputSchema: SendMassNotificationOutputSchema,
  },
  async (input) => {
    const allUsers = await getAllUserProfiles();
    
    // The notification message combines the title and the message.
    const fullMessage = `${input.title}: ${input.message}`;

    const notificationPromises = allUsers.map(user => 
        addNotification(user.uid, fullMessage, 'event', input.link)
    );

    await Promise.all(notificationPromises);

    return { count: allUsers.length };
  }
);

    