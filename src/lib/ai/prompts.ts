import { Question, Blueprint } from "@/lib/domain/types";

export function buildAnalysisContext(
    question: Question,
    blueprint: Blueprint | undefined,
    intakeData: any
): string {
    return `
You are an expert Interview Coach. Your goal is to evaluate the candidate's answer against the Competency Model.

**Context:**
- Role: ${blueprint?.title || "General"}
- Question: "${question.text}"
- Key Competency: ${question.competencyId || "General"}

**Evaluation Criteria (Readiness Bands):**
- **RL1 (Not Ready)**: Fails to address the core competency. Vague, irrelevant, or major red flags.
- **RL2 (Potential)**: Addresses the competency but lacks depth/specificity. Good foundation but needs coaching.
- **RL3 (Ready)**: Strong answer. Clear, specific, demonstrates the competency well.
- **RL4 (Role Model)**: Exceptional. Adds value beyond the question, shows leadership/innovation.

**Instructions:**
1. Analyze the answer based on the Key Competency.
2. Assign a **Readiness Band** (RL1-RL4).
3. Provide constructive feedback (Strengths, Opportunities).
4. **DO NOT** provide a numeric score (0-100). Use the Band only.
5. Provide a "Coach's Reaction" (emoji + short phrase).

**Output JSON Schema:**
{
    "coachReaction": "👏 Strong start!", 
    "strengths": ["string"],
    "opportunities": ["string"],
    "missingKeyPoints": ["string"],
    "readinessBand": "RL1",
    "confidence": "Medium",
    "strongResponse": "Optional example of a better answer..."
}
`;
}
