import { GoogleGenAI } from "@google/genai";
import { Question, Blueprint, AnalysisResult } from "@/lib/domain/types";
import { buildAnalysisContext } from "@/lib/ai/prompts";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export class AIService {
    static async analyzeAnswer(
        question: Question,
        answerText: string,
        blueprint?: Blueprint,
        intakeData?: any
    ): Promise<AnalysisResult> {

        // Mock Fallback (if no Key)
        if (!ai) {
            console.warn("AI Service: No API Key, returning mock analysis.");
            return {
                readinessBand: "RL2",
                confidence: "Medium",
                coachReaction: "🤔 Good start but needs detail.",
                strengths: ["Addressed the core topic"],
                opportunities: ["Provide a specific example (STAR method)", "Quantify impact"],
                transcript: answerText
            };
        }

        try {
            const prompt = buildAnalysisContext(question, blueprint, intakeData);
            const userContent = `Candidate Answer: "${answerText}"`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: {
                    parts: [
                        { text: prompt },
                        { text: userContent }
                    ]
                },
                config: {
                    responseMimeType: 'application/json',
                },
            });

            const text = response.text;
            if (!text) throw new Error("Empty AI Response");

            const result = JSON.parse(text);
            return {
                ...result,
                transcript: answerText
            };

        } catch (error) {
            console.error("AI Analysis Failed", error);
            // Fallback
            console.error("AI Analysis Failed", error);
            // Fallback - Return a mock analysis so the UI doesn't break during demos/dev without key
            return {
                readinessBand: "RL2",
                confidence: "Medium",
                coachReaction: "🤔 Good effort! I see what you're getting at.",
                strengths: ["You answered the prompt directly.", "Clear structure."],
                opportunities: ["Try to be more specific with examples.", "Use the STAR method more strictly."],
                transcript: answerText
            };
        }
    }
}
