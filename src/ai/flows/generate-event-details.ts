
'use server';
/**
 * @fileOverview An AI flow for generating event details.
 *
 * - generateEventDescription - A function that generates an event description.
 * - GenerateEventDescriptionInput - The input type for the generateEventDescription function.
 * - GenerateEventDescriptionOutput - The return type for the generateEventDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateEventDescriptionInputSchema = z.object({
  eventName: z.string().describe('The name or title of the event.'),
});
export type GenerateEventDescriptionInput = z.infer<typeof GenerateEventDescriptionInputSchema>;

const GenerateEventDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated event description.'),
});
export type GenerateEventDescriptionOutput = z.infer<typeof GenerateEventDescriptionOutputSchema>;

export async function generateEventDescription(input: GenerateEventDescriptionInput): Promise<GenerateEventDescriptionOutput> {
  return generateEventDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventDescriptionPrompt',
  input: { schema: GenerateEventDescriptionInputSchema },
  output: { schema: GenerateEventDescriptionOutputSchema },
  prompt: `You are an expert event marketer. Your task is to generate a compelling and professional event description based on the event name provided.

The description should be engaging, informative, and suitable for a corporate audience. It should be approximately 2-3 paragraphs long.

Event Name: {{{eventName}}}
`,
});

const generateEventDescriptionFlow = ai.defineFlow(
  {
    name: 'generateEventDescriptionFlow',
    inputSchema: GenerateEventDescriptionInputSchema,
    outputSchema: GenerateEventDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
