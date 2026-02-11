import { GoogleGenAI, Type } from "@google/genai";
import { QuestionTips, StrongResponseResult } from "@/lib/domain/types";
import { Logger } from "@/lib/logger";

// --- Service ---
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export class StrongResponseService {
    static async generateStrongResponse(
        questionText: string,
        tips: QuestionTips
    ): Promise<StrongResponseResult> {

        if (!ai) {
            Logger.warn("[StrongResponseService] No API Key, returning mock response.");
            return {
                strongResponse: "This is a mock strong response because the API key is missing. It would usually be a comprehensive answer following the STAR method.",
                whyThisWorks: {
                    lookingFor: "Demonstration of resilience (Mock)",
                    pointsToCover: ["Situation", "Action", "Result"],
                    answerFramework: "STAR (Mock)",
                    industrySpecifics: { metrics: "N/A", tools: "N/A" },
                    mistakesToAvoid: ["N/A"],
                    proTip: "Mock Pro Tip"
                }
            };
        }

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

        const prompt = `
        You are an expert interview coach.
        Interview Question: "${questionText}".
        
        ${tipsContext}

        Task:
        1. GENERATE A STRONG RESPONSE: Create a hypothetical "Strong" (10/10) answer to this question. 
           - It MUST explicitly follow the provided "Answer Framework" and "Points to Cover".
           - It should be natural, professional, and ~150-200 words.
        2. GENERATE "WHY THIS WORKS": Explain why your generated strong response is effective by mapping it back to the specific categories in the coaching tips.
           - Fill out a structure IDENTICAL to the input tips, but the content should be your explanation of how the strong response meets that criteria.

        Return strictly JSON matching this structure:
        {
           strongResponse: "The full text of the robust answer",
           whyThisWorks: {
               lookingFor: "Explanation relative to answer",
               pointsToCover: ["Point 1 explanation", "Point 2 explanation"],
               answerFramework: "Framework usage explanation",
               industrySpecifics: { metrics: "Metrics used", tools: "Tools mentioned" },
               mistakesToAvoid: ["How mistakes were avoided"],
               proTip: "How the pro tip was applied"
           }
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
                            strongResponse: { type: Type.STRING },
                            whyThisWorks: {
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
                        required: ['strongResponse', 'whyThisWorks'],
                    },
                },
            });

            const text = response.text;
            if (!text) throw new Error('No text returned from Gemini for strong response');

            return JSON.parse(text) as StrongResponseResult;

        } catch (error) {
            Logger.error("[StrongResponseService] Generation Failed", error);
            throw error;
        }
    }
}
