import { Question, Blueprint } from "@/lib/domain/types";

export function buildAnalysisContext(
    question: Question,
    blueprint: Blueprint | undefined,
    intakeData: any
): string {

    // --- 1. Blueprint Context ---
    let blueprintContext = '';

    if (blueprint) {
        blueprintContext = `
BLUEPRINT CONTEXT:
Job Role: ${blueprint.title || 'Unknown Role'}
Competencies: ${JSON.stringify(blueprint.competencies?.map((c: any) => ({
            id: c.id,
            name: c.title || c.name,
            definition: c.description || c.definition
        })))}
`;
    }

    // --- 2. Reading Level Context ---
    const readingLevelContext = `
    READING LEVEL:
    - Keep language clear, professional, but accessible.
    - Avoid excessive corporate jargon.
    - Adopt a supportive, coaching tone.
`;

    // --- 3. Intake / Personalization Context ---
    let struggleContext = '';
    if (intakeData?.biggestStruggle) {
        const s = intakeData.biggestStruggle;
        struggleContext = `
    USER STRUGGLE AREA ("${s}"):
    - The user specifically wants help with: ${s}.
    - ${s === 'getting_started' ? 'Focus on: Hesitation and initial framing.' : ''}
    - ${s === 'staying_organized' ? 'Focus on: Structure and rambling.' : ''}
    - ${s === 'explaining_impact' ? 'Focus on: Outcomes and metrics.' : ''}
    - ${s === 'behavioral_storytelling' ? "Focus on: STAR Method adherence." : ''}
    - ${s === 'nerves_anxiety' ? 'Focus on: Tone and confidence. Be extra supportive.' : ''}
    `;
    }

    let goalContext = '';
    if (intakeData?.primaryGoal) {
        const g = intakeData.primaryGoal;
        goalContext = `
    USER GOAL ("${g}"):
    - ${g === 'build_confidence' ? 'Be extra encouraging.' : ''}
    - ${g === 'get_more_structured' ? 'Strictly evaluate structure.' : ''}
    - ${g === 'improve_metrics' ? 'Look for numbers and impact.' : ''}
    `;
    }

    let stageContext = '';
    if (intakeData?.stage) {
        const stage = intakeData.stage;
        stageContext = `
    INTERVIEW STAGE ("${stage}"):
    - ${stage === 'recruiter_screen' ? 'Focus on: Basic fit and clarity.' : ''}
    - ${stage === 'hiring_manager' ? 'Focus on: Competence and depth.' : ''}
    - ${stage === 'final_round' ? 'Focus on: Leadership and strategy.' : ''}
    `;
    }

    // --- 4. Assembly ---
    return `
You are an expert Interview Coach.
Your goal is to evaluate the candidate's answer and provide actionable, structured feedback.

${blueprintContext}
${struggleContext}
${goalContext}
${stageContext}
${readingLevelContext}

**Question**: "${question.text}"
**Category**: ${question.category}
${question.competencyId ? `**Target Competency**: ${question.competencyId}` : ''}
`;
}
