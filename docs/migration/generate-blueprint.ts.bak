import { GoogleGenAI, Type } from '@google/genai';
import { validateUser } from '../utils/auth.js';
import { GenerateBlueprintSchema } from '../schemas.js';
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

    const parseResult = GenerateBlueprintSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request', details: parseResult.error.format() });
    }

    const { role, jobDescription, seniority } = parseResult.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
You are a senior interview coach and rubric engineer. Your job is to translate a job title and optional job description into a competency-driven interview rubric that can generate questions and score answers reliably.

USER
Create a Competency Blueprint in strict JSON.

INPUTS:
- roleTitle: ${role}
- jobDescription: ${jobDescription || 'N/A'}
- seniority (optional): ${seniority || 'mid-level'}

REQUIREMENTS:
1) Extract 5–8 competencies that matter most for success in the role.
2) Each competency must include: id, name, definition, signals, evidenceExamples, weight (1–5), and bands (Developing/Good/Strong behavioral anchors).
3) Provide a recommended questionMix across behavioral/situational/technical.
4) Provide a scoringModel with 5–7 dimensions and weights (1–5).
5) Ensure weights reflect role priorities.
6) Output ONLY valid JSON.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            role: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                seniority: { type: Type.STRING },
              },
              required: ['title'],
            },
            readingLevel: {
              type: Type.OBJECT,
              properties: {
                mode: { type: Type.STRING },
                maxSentenceWords: { type: Type.INTEGER },
                avoidJargon: { type: Type.BOOLEAN },
              },
              required: ['mode', 'maxSentenceWords', 'avoidJargon'],
            },
            competencies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  signals: { type: Type.ARRAY, items: { type: Type.STRING } },
                  evidenceExamples: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weight: { type: Type.INTEGER },
                  bands: {
                    type: Type.OBJECT,
                    properties: {
                      Developing: { type: Type.STRING },
                      Good: { type: Type.STRING },
                      Strong: { type: Type.STRING },
                    },
                    required: ['Developing', 'Good', 'Strong'],
                  },
                },
                required: [
                  'id',
                  'name',
                  'definition',
                  'signals',
                  'evidenceExamples',
                  'weight',
                  'bands',
                ],
              },
            },
            questionMix: {
              type: Type.OBJECT,
              properties: {
                behavioral: { type: Type.NUMBER },
                situational: { type: Type.NUMBER },
                technical: { type: Type.NUMBER },
              },
              required: ['behavioral', 'situational', 'technical'],
            },
            scoringModel: {
              type: Type.OBJECT,
              properties: {
                dimensions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      weight: { type: Type.INTEGER },
                    },
                    required: ['id', 'name', 'weight'],
                  },
                },
                ratingBands: {
                  type: Type.OBJECT,
                  properties: {
                    Developing: {
                      type: Type.OBJECT,
                      properties: { min: { type: Type.INTEGER }, max: { type: Type.INTEGER } },
                      required: ['min', 'max'],
                    },
                    Good: {
                      type: Type.OBJECT,
                      properties: { min: { type: Type.INTEGER }, max: { type: Type.INTEGER } },
                      required: ['min', 'max'],
                    },
                    Strong: {
                      type: Type.OBJECT,
                      properties: { min: { type: Type.INTEGER }, max: { type: Type.INTEGER } },
                      required: ['min', 'max'],
                    },
                  },
                  required: ['Developing', 'Good', 'Strong'],
                },
              },
              required: ['dimensions', 'ratingBands'],
            },
          },
          required: ['role', 'readingLevel', 'competencies', 'scoringModel', 'questionMix'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from Gemini');

    const blueprint = JSON.parse(text);
    return res.status(200).json(blueprint);
  } catch (error: unknown) {
    logger.error('Handler Error', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Authorization') || errorMessage.includes('Token')) {
      return res.status(401).json({ error: errorMessage });
    }
    return res.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  }
}
