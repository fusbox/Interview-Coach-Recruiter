import { GoogleGenAI, Type } from '@google/genai';
import { validateUser } from '../utils/auth.js';
import { GenerateQuestionPlanSchema } from '../schemas.js';
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

    const parseResult = GenerateQuestionPlanSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request', details: parseResult.error.format() });
    }

    const { blueprint } = parseResult.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const N_QUESTIONS = 5;

    const systemPrompt = `
You are an interview designer. Build a balanced question plan aligned to the competency blueprint.

USER
Create a question plan for this role using the blueprint.

RULES:
- Generate exactly ${N_QUESTIONS} questions.
- Each question must map to exactly one competencyId.
- Ensure balanced coverage: all competencies should be hit at least once if possible, or prioritized by weight.
- Types must follow blueprint.questionMix approximately.
- Return ONLY strict JSON.

INPUT BLUEPRINT JSON:
${JSON.stringify(blueprint)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  competencyId: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['behavioral', 'situational', 'technical'] },
                  difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                  intent: { type: Type.STRING },
                  rubricHints: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['id', 'competencyId', 'type', 'difficulty', 'intent'],
              },
            },
          },
          required: ['role', 'questions'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from Gemini');

    const questionPlan = JSON.parse(text);
    return res.status(200).json(questionPlan);
  } catch (error: unknown) {
    logger.error('Handler Error', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Authorization') || errorMessage.includes('Token')) {
      return res.status(401).json({ error: errorMessage });
    }
    return res.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  }
}
