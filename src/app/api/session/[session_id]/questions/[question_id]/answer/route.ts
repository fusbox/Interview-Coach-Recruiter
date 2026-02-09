import { NextResponse } from "next/server";
import { SupabaseSessionRepository } from "@/lib/server/infrastructure/supabase-session-repository";
import { z } from "zod";
import { requireCandidateToken } from "@/lib/server/auth/candidate-token";

const repository = new SupabaseSessionRepository();

const DraftSchema = z.object({
    text: z.string(),
    isFinal: z.boolean().optional() // For future use if we merge submit/draft
});

export async function PUT(
    request: Request,
    { params }: { params: { session_id: string; question_id: string } }
) {
    try {
        const auth = await requireCandidateToken(request, params.session_id);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const body = await request.json();
        const { text } = DraftSchema.parse(body);

        const session = await repository.get(params.session_id);
        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Update the specific answer draft
        const currentAns = session.answers[params.question_id] || {
            questionId: params.question_id,
            transcript: "",
            draft: "",
            analysis: undefined
        };

        session.answers[params.question_id] = {
            ...currentAns,
            draft: text,
            // We don't change submittedAt for drafts
        };

        await repository.update(session);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Save Draft Failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
