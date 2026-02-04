import { GoogleGenAI, Type } from '@google/genai';
import { validateUser } from '../utils/auth.js';
import { GenerateStrongResponseSchema } from '../schemas.js';
import { logger } from '../utils/logger.js';

import { ApiRequest, ApiResponse } from '../types.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 0. Auth Validation
    await validateUser(req);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const parseResult = GenerateStrongResponseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request', details: parseResult.error.format() });
    }

    const { question, tips } = parseResult.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('Server Error: GEMINI_API_KEY is missing');
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Helper to format tips for the prompt
    const tipsContext = `
        Use the following coaching tips as the standard for your analysis and generation:
        - What they're looking for: "${tips.lookingFor}"
        - Points to cover: ${JSON.stringify(tips.pointsToCover)}
        - Answer framework: "${tips.answerFramework}"
        - Industry specifics: ${JSON.stringify(tips.industrySpecifics)}
        - Mistakes to avoid: ${JSON.stringify(tips.mistakesToAvoid)}
        - Pro tip: "${tips.proTip}"
        `;

    try {
      const contentParts = [
        {
          text: `You are an expert interview coach.
          Interview Question: "${question}".
          
          ${tipsContext}

          Task:
          1. GENERATE A STRONG RESPONSE: Create a hypothetical "Strong" (10/10) answer to this question. 
             - It MUST explicitly follow the provided "Answer Framework" and "Points to Cover".
             - It should be natural, professional, and ~150-200 words.
          2. GENERATE "WHY THIS WORKS": Explain why your generated strong response is effective by mapping it back to the specific categories in the coaching tips.
             - Fill out a structure IDENTICAL to the input tips, but the content should be your explanation of how the strong response meets that criteria.
          `,
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: contentParts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strongResponse: { type: Type.STRING },
              whyThisWorks: {
                type: Type.OBJECT,
                properties: {
                  lookingFor: { type: Type.STRING },
                  pointsToCover: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answerFramework: { type: Type.STRING },
                  industrySpecifics: {
                    type: Type.OBJECT,
                    properties: {
                      metrics: { type: Type.STRING },
                      tools: { type: Type.STRING },
                    },
                  },
                  mistakesToAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
                  proTip: { type: Type.STRING },
                },
              },
            },
            required: ['strongResponse', 'whyThisWorks'],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error('No text returned from strong response generation');

      const result = JSON.parse(text);
      return res.status(200).json(result);
    } catch (error: unknown) {
      logger.error('Error generating strong response', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Authorization') || errorMessage.includes('Token')) {
        return res.status(401).json({ error: errorMessage });
      }
      return res
        .status(500)
        .json({ error: 'Failed to generate strong response', details: errorMessage });
    }
  } catch (error: unknown) {
    // Catch block for errors from validateUser or other top-level operations
    logger.error('Handler error', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Authorization') || errorMessage.includes('Token')) {
      return res.status(401).json({ error: errorMessage });
    }
    return res.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  }
}
