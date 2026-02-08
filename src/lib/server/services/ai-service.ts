import { GoogleGenAI } from "@google/genai";
import { Question, Blueprint, AnalysisResult } from "@/lib/domain/types";
import { buildAnalysisContext } from "@/lib/ai/prompts";

const apiKey = process.env.GEMINI_API_KEY;
console.log("[AIService] API Key Present?", !!apiKey, "Length:", apiKey?.length);
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export class AIService {
    static async analyzeAnswer(
        question: Question,
        answerText: string | null,
        audioData: { base64: string; mimeType: string } | null,
        blueprint?: Blueprint,
        intakeData?: any
    ): Promise<AnalysisResult> {

        // 1. Context Construction
        const contextPrompt = buildAnalysisContext(question, blueprint, intakeData);

        // 2. Strict JSON System Prompt (V2 Schema)
        const systemPrompt = `SYSTEM:
You are a calm, supportive interview coach.
You must produce feedback that is coaching, not evaluation.

NON-NEGOTIABLE RULES:
- Output MUST be valid JSON only. No prose outside JSON.
- Never use scores, numbers, rankings, or comparisons to other people.
- Never say pass/fail, readiness, competitive, hire, reject, or imply screening.
- Never simulate an interviewer’s judgment.
- Do not mention “signal quality”, “tier”, “confidence weighting”, or “model confidence”.
- Keep language clear and non-technical.
- Use “listener” phrasing rather than “interviewer” phrasing.

STRUCTURE RULES:
- ack: exactly 1 sentence, observational, no judgment adjectives.
- primaryFocus: EXACTLY ONE focus. It must be a communication lever the user can act on next.
- whyThisMatters: include ONLY if tier >= 1 AND providedAllowed=true.
- observations: 0–3 items. Observational only; DO NOT use advice verbs like “try/should/need”.
- nextAction: EXACTLY ONE action, predictable, neutral, optional-feeling.

MODALITY RULES:
- If modality="voice": you may reference pacing, pausing, clarity of transitions, and emphasis.
  Never mention posture, eye contact, attire, facial expressions, gestures, accent, or voice quality.
- If modality="text": you may reference structure, clarity, and placement of outcome statements.
  Never mention typing speed.

TIER RULES (internal guidance only):
- Tier 0: communication-only language. Do not reference role expectations or competencies. Omit whyThisMatters unless explicitly allowed and tier>=1 (so normally no).
- Tier 1: you may explain why the focus helps for this role (role context). Still do not name competencies.
- Tier 2: you may name ONE relevant competency (if given), but frame it as communication behavior, not evaluation.

SAFETY:
If the input evidence is weak or unclear, use more tentative language and keep feedback minimal.
If you are uncertain, prefer silence (empty observations array) over invented specifics.`;

        const schemaPrompt = `
Generate post-answer feedback as strict JSON matching this schema:
{
  "ack": "string",
  "primaryFocus": {
    "dimension": "structural_clarity | outcome_explicitness | specificity_concreteness | decision_rationale | focus_relevance | delivery_control",
    "headline": "string",
    "body": "string"
  },
  "whyThisMatters": "string (optional)",
  "observations": ["string", "string", "string"],
  "nextAction": {
    "label": "string",
    "actionType": "redo_answer | next_question | practice_example | stop_for_now"
  },
  "meta": {
    "tier": 0|1|2,
    "modality": "text|voice",
    "signalQuality": "insufficient|emerging|reliable|strong",
    "confidence": "low|medium|high"
  },
  "transcript": "string (REQUIRED for voice input, optional for text)"
}

CONTEXT (do not reveal these labels; use them only to shape delivery):
- surface: recruiter_prep
- modality: ${audioData ? 'voice' : 'text'}
- tier: 1
- signalQuality: reliable
- userConfidence: medium
- providedAllowedForWhy: true

QUESTION:
${question.text}

OBSERVABLE MARKERS (facts; do not embellish):
- (Heuristics disabled for audio/mixed input, rely on extensive blueprint context)

FOCUS CONSTRAINT:
- Choose the most relevant dimension based on the context and answer.

OUTPUT REQUIREMENTS:
- Output ONLY valid JSON.
`;

        // Mock Fallback
        if (!ai) {
            console.warn("AI Service: No API Key, returning mock analysis V2.");
            await new Promise(r => setTimeout(r, 1500));
            return {
                ack: "I see you're focusing on a specific project challenge.",
                primaryFocus: {
                    dimension: "structural_clarity",
                    headline: "Let's organize the story",
                    body: "You jumped straight into the solution. Start by setting the context so I understand the stakes."
                },
                whyThisMatters: "Without context, the impact of your actions is hard to judge.",
                observations: ["Started with 'I decided to...'", "Mentioned '20% increase' at the end"],
                nextAction: {
                    label: "Try again with STAR",
                    actionType: "redo_answer"
                },
                meta: {
                    tier: 1,
                    modality: audioData ? "voice" : "text",
                    signalQuality: "emerging",
                    confidence: "medium"
                },
                transcript: answerText || "Audio Answer (Mock)"
            };
        }

        try {
            const parts: any[] = [
                { text: systemPrompt },
                { text: contextPrompt }, // Injected Blueprint/Intake Context
                { text: schemaPrompt }
            ];

            if (audioData) {
                parts.push({
                    inlineData: {
                        mimeType: audioData.mimeType,
                        data: audioData.base64
                    }
                });
                parts.push({ text: "Please transcribe the audio and analyze it. Return the transcript in the 'transcript' field." });
            } else if (answerText) {
                parts.push({ text: `USER ANSWER: "${answerText}"` });
            } else {
                throw new Error("No input provided (text or audio)");
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: parts
                },
                config: {
                    responseMimeType: 'application/json',
                },
            });

            const text = response.text;
            if (!text) throw new Error("Empty AI Response");

            const result = JSON.parse(text);

            // Ensure transcript exists (from AI or input)
            const finalTranscript = result.transcript || answerText || "Audio Answer";

            return {
                ...result,
                transcript: finalTranscript,
                // Map to legacy for safety if UI needs it
                readinessBand: "RL2",
                coachReaction: result.ack,
                strengths: result.observations || [],
                opportunities: [result.primaryFocus?.headline || "Review feedback"]
            };

        } catch (error) {
            console.error("AI Analysis Failed", error);
            // Fallback V2
            return {
                ack: "I noted your answer.",
                primaryFocus: {
                    dimension: "structural_clarity",
                    headline: "System Offline",
                    body: "I couldn't analyze that response right now. Please try again."
                },
                observations: [],
                nextAction: { label: "Move On", actionType: "next_question" },
                transcript: answerText || "Audio Answer",
                readinessBand: "RL2",
                coachReaction: "Error",
                strengths: [],
                opportunities: []
            };
        }
    }
}
