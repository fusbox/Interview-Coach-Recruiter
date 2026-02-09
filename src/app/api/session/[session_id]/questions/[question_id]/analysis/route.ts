import { NextResponse } from "next/server";
import { SupabaseSessionRepository } from "@/lib/server/infrastructure/supabase-session-repository";
import { AIService } from "@/lib/server/services/ai-service";
import { getAnalysisContext } from "@/lib/server/session/orchestrator";
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

        const session = await repository.get(params.session_id);
        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const answer = session.answers[params.question_id];
        if (!answer?.submittedAt || !answer.transcript) {
            return NextResponse.json({ error: "Answer not submitted" }, { status: 400 });
        }

        if (answer.analysis) {
            return NextResponse.json(session);
        }

        const context = getAnalysisContext(session, params.question_id);
        if (!context) {
            return NextResponse.json({ error: "Question context missing" }, { status: 404 });
        }

        const analysis = await AIService.analyzeAnswer(context.question, answer.transcript, null);
        const updatedSession = {
            ...session,
            status: "REVIEWING",
            answers: {
                ...session.answers,
                [params.question_id]: {
                    ...answer,
                    analysis
                }
            }
        };

        await repository.update(updatedSession);

        return NextResponse.json(updatedSession);
    } catch (error) {
        console.error("Analysis Trigger Failed:", error);
        return NextResponse.json({ error: "Failed to analyze answer" }, { status: 500 });
    }
}
