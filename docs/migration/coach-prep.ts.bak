import { GoogleGenAI, Type } from '@google/genai';
import { validateUser } from '../utils/auth.js';
import { CoachPrepSchema } from '../schemas.js';
import { logger } from '../utils/logger.js';

import { ApiRequest, ApiResponse } from '../types.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await validateUser(req);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const parseResult = CoachPrepSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request', details: parseResult.error.format() });
    }

    const { role, jobDescription } = parseResult.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a supportive interview coach about to prep a candidate for a "${role}" interview.
${jobDescription ? `Job Description: ${jobDescription}` : ''}

Generate ULTRA-BRIEF prep advice. Like a trainer giving final reminders.

1. "greeting": Short opener. Format: "Got it! Some final tips for your [role] interview:"
   - Max 10 words. No questions.
   
2. "advice": SENTENCE FRAGMENTS ONLY. Max 25-35 words total.
   - What to expect (short phrase).
   - How to answer (short phrase).
   - What to demonstrate (reference keySkills).
   - Tie it back to what outcome (1 phrase).
   Example: "Behavioral questions ahead. Give specific examples. Show your [skill1], [skill2]. Tie everything back to [outcome]."
   
3. "keySkills": Array of 2-3 skill keywords from the JD.

4. "encouragement": Brief close, 6-10 words max.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            greeting: {
              type: Type.STRING,
              description:
                "Short opener like 'Got it! For your [role] interview, some quick points:'",
            },
            advice: {
              type: Type.STRING,
              description: 'Cohesive paragraph of punchy, trainer-style advice, 40-60 words',
            },
            keySkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-4 key skill keywords to highlight',
            },
            encouragement: {
              type: Type.STRING,
              description: 'Brief supportive close, 8-12 words',
            },
          },
          required: ['greeting', 'advice', 'keySkills', 'encouragement'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No response from Gemini');

    const result = JSON.parse(text);
    return res.status(200).json(result);
  } catch (error: unknown) {
    logger.error('Coach Prep Error', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('Authorization') || errorMessage.includes('Token')) {
      return res.status(401).json({ error: errorMessage });
    }
    return res.status(500).json({ error: 'Failed to generate coach prep', details: errorMessage });
  }
}
