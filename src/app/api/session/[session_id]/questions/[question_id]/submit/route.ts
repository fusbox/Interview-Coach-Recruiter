import { NextResponse } from "next/server";
import { submitAnswer, getAnalysisContext } from "@/lib/server/session/orchestrator";
import { SupabaseSessionRepository } from "@/lib/server/infrastructure/supabase-session-repository";
import { AIService } from "@/lib/server/services/ai-service";
import { z } from "zod";

const repository = new SupabaseSessionRepository();

export async function POST(
    request: Request,
    { params }: { params: { session_id: string; question_id: string } }
) {
    try {
        const body = await request.json();
        const { text, analysis } = z.object({
            text: z.string(),
            analysis: z.any().optional() // Allow client to pass partial analysis or none
        }).parse(body);

        const answer = text; // Alias for internal logic

        // 1. Get Session
        console.log(`[SubmitAPI] Fetching session ${params.session_id}`);
        const session = await repository.get(params.session_id);
        if (!session) {
            console.error(`[SubmitAPI] Session ${params.session_id} not found`);
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // 2. Submit Answer (Updates Session State)
        console.log(`[SubmitAPI] Submitting answer for Q: ${params.question_id}`);

        // ... Logic ...

        let finalAnalysis = analysis;
        if (!finalAnalysis) {
            console.log(`[SubmitAPI] Triggering AI Analysis...`);
            const context = getAnalysisContext(session, params.question_id);
            if (context) {
                finalAnalysis = await AIService.analyzeAnswer(context.question, answer);
                console.log(`[SubmitAPI] AI Analysis Complete:`, finalAnalysis?.confidence);
            } else {
                console.warn(`[SubmitAPI] Context not found for analysis`);
            }
        }

        const updatedSession = submitAnswer(session, params.question_id, answer, finalAnalysis || {});
        console.log(`[SubmitAPI] Session Updated (Memory), Status: ${updatedSession.status}`);

        // 3. Persist
        await repository.update(updatedSession);
        console.log(`[SubmitAPI] Session Persisted to DB`);

        return NextResponse.json(updatedSession);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
    }
}
