import { GoogleGenAI, Type } from '@google/genai';
import { validateUser } from '../utils/auth.js';
import { GenerateTipsSchema } from '../schemas.js';
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

    const parseResult = GenerateTipsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request', details: parseResult.error.format() });
    }

    const { question, role, competency, intakeData, blueprint } = parseResult.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('Server Error: GEMINI_API_KEY is missing');
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Competency-Driven Context
    let competencyContext = '';
    if (competency) {
      competencyContext = `
            COMPETENCY FOCUS: ${competency.name}
            DEFINITION: ${competency.definition}
            SIGNALS (Points to Cover): ${competency.signals?.join('; ') || 'N/A'}
            DEVELOPING BEHAVIOR (Mistakes): ${competency.bands?.Developing || 'N/A'}
            STRONG BEHAVIOR (Pro Tip): ${competency.bands?.Strong || 'N/A'}
            
            INSTRUCTIONS:
            - "lookingFor": Use the Definition.
            - "pointsToCover": Simplify the Signals into bullet points.
            - "mistakesToAvoid": Base this on the Developing behavior (what NOT to do).
            - "proTip": Base this on the Strong behavior (what TO do).
            `;
    }

    const readingLevelContext = blueprint?.readingLevel
      ? `
    READING LEVEL INSTRUCTIONS (Mode: ${blueprint.readingLevel.mode}):
    - Constraint: Max ${blueprint.readingLevel.maxSentenceWords} words per sentence.
    - Avoid Jargon: ${blueprint.readingLevel.avoidJargon}
    - TONE: Direct, clear, and actionable.
    
    CRITICAL: Apply these reading constraints to ALL generated tips:
    1. "lookingFor": Use simple language to explain the goal.
    2. "pointsToCover": Bullet points must be short and punchy.
    3. "mistakesToAvoid": Clear warnings, no ambiguity.
    4. "proTip": One powerful sentence, easy to grasp.
        `
      : '';

    // Struggle Context
    let struggleContext = '';
    if (intakeData?.biggestStruggle) {
      const s = intakeData.biggestStruggle;
      struggleContext = `
    CUSTOM FOCUS (User Struggle: "${s}"):
    - User wants help with: ${s}.
    - "proTip": MUST directly address how to overcome ${s} in this specific context.
            `;
    }

    // Primary Goal Context
    let goalContext = '';
    if (intakeData?.primaryGoal) {
      const goal = intakeData.primaryGoal;
      goalContext = `
    GOAL-DRIVEN TIPS FOCUS (Goal: ${goal}):
    - ${goal === 'build_confidence' ? 'Frame all tips supportively. Emphasize that the user CAN do this.' : ''}
    - ${goal === 'get_more_structured' ? '"answerFramework": Recommend a clear framework (STAR, PAR, etc.). Explain step-by-step.' : ''}
    - ${goal === 'practice_star_stories' ? '"proTip": Explain STAR method in detail. Give a mini-example if possible.' : ''}
    - ${goal === 'get_more_concise' ? '"proTip": Give brevity advice. \'Less is more\' framing.' : ''}
    - ${goal === 'improve_metrics' ? '"pointsToCover": Include a point about quantifying results with numbers/metrics.' : ''}
    - ${goal === 'role_specific_depth' ? 'Include role-specific technical nuances in tips.' : ''}
    - ${goal === 'practice_hard_questions' ? '"proTip": Advanced strategies for handling curveball questions.' : ''}
            `;
    }

    // Interview Stage Context
    let stageContext = '';
    if (intakeData?.stage) {
      const stage = intakeData.stage;
      stageContext = `
    INTERVIEW STAGE TIPS (Stage: ${stage}):
    - ${stage === 'recruiter_screen' ? '"lookingFor": Mention this is a recruiter screen—focus on fit and communication. Keep tips accessible.' : ''}
    - ${stage === 'hiring_manager' ? '"lookingFor": This is a hiring manager interview—emphasize role-specific competence and problem-solving.' : ''}
    - ${stage === 'panel' ? '"proTip": Advise on handling multiple interviewers. Address different perspectives in responses.' : ''}
    - ${stage === 'final_round' ? '"proTip": Emphasize executive presence, strategic thinking, and demonstrating culture add.' : ''}
            `;
    }

    const prompt = `
    You are an expert interview coach for ${role} roles.
    Provide detailed interview tips for the following question: "${question}"

    ${competencyContext}
    ${readingLevelContext}
    ${struggleContext}
    ${goalContext}
    ${stageContext}

    Return strictly JSON matching this structure:
    {
       lookingFor: "What the interviewer is trying to assess",
       pointsToCover: ["Point 1", "Point 2", "Point 3"],
       answerFramework: "Recommended structure (e.g. STAR, Past-Present-Future)",
       industrySpecifics: { metrics: "Key KPIs to mention", tools: "Relevant software/tools" },
       mistakesToAvoid: ["Mistake 1", "Mistake 2", "Mistake 3"],
       proTip: "One advanced insight or unique tip"
    }
  `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lookingFor: { type: Type.STRING },
              pointsToCover: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              answerFramework: { type: Type.STRING },
              industrySpecifics: {
                type: Type.OBJECT,
                properties: {
                  metrics: { type: Type.STRING },
                  tools: { type: Type.STRING },
                },
              },
              mistakesToAvoid: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              proTip: { type: Type.STRING },
            },
            required: [
              'lookingFor',
              'pointsToCover',
              'answerFramework',
              'industrySpecifics',
              'mistakesToAvoid',
              'proTip',
            ],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error('No text returned from Gemini for tips');

      const tips = JSON.parse(text);
      return res.status(200).json(tips);
    } catch (error: unknown) {
      logger.error('Error generating tips', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Authorization') || errorMessage.includes('Token')) {
        return res.status(401).json({ error: errorMessage });
      }
      return res.status(500).json({ error: 'Failed to generate tips', details: errorMessage });
    }
  } catch (error: unknown) {
    logger.error('Error in handler', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Authorization') || errorMessage.includes('Token')) {
      return res.status(401).json({ error: errorMessage });
    }
    return res.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  }
}
