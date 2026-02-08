import { NextResponse } from "next/server";
import { submitAnswer } from "@/lib/server/session/orchestrator";
import { SupabaseSessionRepository } from "@/lib/server/infrastructure/supabase-session-repository";
import { z } from "zod";
import { requireCandidateToken } from "@/lib/server/auth/candidate-token";

const repository = new SupabaseSessionRepository();

export async function POST(
    request: Request,
    { params }: { params: { session_id: string; question_id: string } }
) {
    try {
        const auth = await requireCandidateToken(request, params.session_id);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

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

        const existingAnswer = session.answers[params.question_id];
        if (existingAnswer?.submittedAt) {
            return NextResponse.json(session);
        }

        // 2. Submit Answer (Updates Session State)
        console.log(`[SubmitAPI] Submitting answer for Q: ${params.question_id}`);

        // ... Logic ...

        const updatedSession = submitAnswer(session, params.question_id, answer, analysis || undefined);
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
