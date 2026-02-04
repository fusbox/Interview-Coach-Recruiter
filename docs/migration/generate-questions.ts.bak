import { GoogleGenAI, Type } from '@google/genai';
import { validateUser } from '../utils/auth.js';
import { GenerateQuestionsSchema } from '../schemas.js';
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

    const parseResult = GenerateQuestionsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request body', details: parseResult.error.format() });
    }

    const { role, jobDescription, questionPlan, blueprint, subsetIndices, intakeData } =
      parseResult.data;

    logger.info(
      `[GenerateQuestions] Role: ${role}, HasPlan: ${!!questionPlan}, Indices: ${JSON.stringify(subsetIndices)}, Confidence: ${intakeData?.confidenceScore}`,
      {
        role,
        hasPlan: !!questionPlan,
        subsetIndices,
        confidenceScore: intakeData?.confidenceScore,
      }
    );

    // Optimization: Filter plan if specific indices requested
    if (questionPlan && Array.isArray(subsetIndices)) {
      const originalLength = questionPlan.questions.length;
      questionPlan.questions = questionPlan.questions.filter((_, idx) =>
        subsetIndices.includes(idx)
      );
      logger.info(
        `[GenerateQuestions] Filtered plan from ${originalLength} to ${questionPlan.questions.length} items.`
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('Server Error: GEMINI_API_KEY is missing');
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const readingLevelContext = blueprint?.readingLevel
      ? `
    READING LEVEL:
    - Mode: ${blueprint.readingLevel.mode}
    - Max Sentence Words: ${blueprint.readingLevel.maxSentenceWords}
    - Avoid Jargon: ${blueprint.readingLevel.avoidJargon}
        `
      : `
    IMPORTANT: Adapt the reading level of the questions to the target candidate profile for a ${role}.
    - If the role is entry-level (e.g., Cashier): STRICTLY use a 6th-7th grade reading level.
    - If the role is highly technical/executive: Use appropriate professional terminology but keep phrasing clear.
    - When in doubt: Prioritize simplicity.
        `;

    // Confidence / Tone Context
    let confidenceContext = '';
    if (intakeData?.confidenceScore) {
      confidenceContext = `
    TONE ADJUSTMENT (Confidence: ${intakeData.confidenceScore}/5):
    - ${intakeData.confidenceScore <= 2 ? 'Candidate is anxious. Use encouraging, supportive phrasing. Avoid harsh or intimidating complexity.' : ''}
    - ${intakeData.confidenceScore === 3 ? 'Candidate is neutral. Use standard professional, neutral phrasing.' : ''}
    - ${intakeData.confidenceScore >= 4 ? 'Candidate is confident. Use direct, challenging, and no-nonsense phrasing.' : ''}
            `;
    }

    // Challenge Level Adjustment
    let challengeContext = '';
    if (intakeData?.challengeLevel) {
      const level = intakeData.challengeLevel;
      challengeContext = `
    DIFFICULTY ADJUSTMENT (Level: ${level}):
    - ${level === 'warm_up' ? 'Keep questions friendly, standard, and confidence-building. Avoid edge cases.' : ''}
    - ${level === 'realistic' ? 'Standard interview difficulty. Mix of standard and behavioral questions.' : ''}
    - ${level === 'challenge' ? 'HARD MODE. Ask complex, multi-layered questions. Test edge cases and stress-test their knowledge.' : ''}
            `;
    }

    // Primary Goal Adjustment
    let goalContext = '';
    if (intakeData?.primaryGoal) {
      const goal = intakeData.primaryGoal;
      goalContext = `
    GOAL-DRIVEN QUESTION FOCUS (Goal: ${goal}):
    - ${goal === 'build_confidence' ? 'Start with easier, confidence-building questions. Avoid intimidating edge cases.' : ''}
    - ${goal === 'get_more_structured' ? 'Include questions that require structured answers (e.g., STAR-format behavioral questions).' : ''}
    - ${goal === 'practice_star_stories' ? 'Favor BEHAVIORAL questions that require storytelling (Situation, Task, Action, Result).' : ''}
    - ${goal === 'get_more_concise' ? 'Standard question complexity. User wants to practice brevity.' : ''}
    - ${goal === 'improve_metrics' ? 'Focus on results-oriented questions. Ask about quantifiable impact and metrics.' : ''}
    - ${goal === 'role_specific_depth' ? 'Include TECHNICAL questions requiring deep domain expertise for the role.' : ''}
    - ${goal === 'practice_hard_questions' ? 'Include difficult, edge-case, or curveball questions. Challenge the candidate.' : ''}
            `;
    }

    // Interview Stage Adjustment
    let stageContext = '';
    if (intakeData?.stage) {
      const stage = intakeData.stage;
      stageContext = `
    INTERVIEW STAGE CONTEXT (Stage: ${stage}):
    - ${stage === 'recruiter_screen' ? 'Focus on soft skills, basic qualifications, culture fit, and communication style. Keep questions accessible.' : ''}
    - ${stage === 'hiring_manager' ? "Focus on role-specific depth, problem-solving ability, and how they'd fit with the team. More technical depth expected." : ''}
    - ${stage === 'panel' ? 'Prepare for cross-functional questions. Multiple perspectives. Expect questions about collaboration and handling diverse stakeholders.' : ''}
    - ${stage === 'final_round' ? 'Executive presence expected. Focus on strategic thinking, leadership, culture add, and long-term vision.' : ''}
            `;
    }

    let promptInfo = '';
    let schema;

    if (questionPlan) {
      // Generate Text from Plan
      promptInfo = `
CONVERT THIS PLAN INTO INTERVIEW QUESTIONS.
PLAN:
${JSON.stringify(questionPlan)}

${confidenceContext}

CONSTRAINTS:
- Create exactly ${questionPlan.questions.length} questions.
- Match ids to plan ids.
- Ensure text accurately reflects the "intent" and "competency".
- Keep questions concise.
            `;

      schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            text: { type: Type.STRING },
            competencyId: { type: Type.STRING },
            type: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            intent: { type: Type.STRING },
          },
          required: ['id', 'text'],
        },
      };
    } else {
      // Legacy / Quick Flow
      promptInfo = jobDescription
        ? `Generate 5 interview questions for a ${role} position based on this job description:\n\n${jobDescription}\n\nQuestions should test skills mentioned in the JD. Return strictly JSON.\nCRITICAL: Ensure that each question covers a distinct aspect or scenario. Avoid generating questions that overlap significantly in the situation or skill being tested (e.g. do not ask two questions about 'dealing with an angry customer' or 'handling conflict').`
        : `Generate 5 common interview questions for a ${role} position. The questions should be diverse (behavioral, technical, situational). Return strictly JSON.\nCRITICAL: Ensure that each question covers a distinct aspect or scenario. Avoid generating questions that overlap significantly in the situation or skill being tested (e.g. do not ask two questions about 'dealing with an angry customer' or 'handling conflict').`;

      schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ['id', 'text'],
        },
      };
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${readingLevelContext}\n${confidenceContext}\n${challengeContext}\n${goalContext}\n${stageContext}\n${promptInfo}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const text = response.text;
      if (!text) throw new Error('No text returned from Gemini');

      const questions = JSON.parse(text);

      // If using plan, merge plan metadata if model missed it (safety net)
      if (questionPlan) {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const finalQuestions = questions.map((q: any) => {
          const planItem = questionPlan.questions.find((p) => p.id === q.id);
          if (planItem) {
            return {
              ...q,
              competencyId: planItem.competencyId,
              type: planItem.type,
              difficulty: planItem.difficulty,
              intent: planItem.intent,
            };
          }
          return q;
        });
        return res.status(200).json(finalQuestions);
      }

      return res.status(200).json(questions);
    } catch (error: unknown) {
      logger.error('Error generating questions', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: 'Failed to generate questions', details: errorMessage });
    }
  } catch (error: unknown) {
    logger.error('Handler Error', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Authorization') || errorMessage.includes('Token')) {
      return res.status(401).json({ error: errorMessage });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
