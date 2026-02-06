import { NextResponse } from "next/server";
import { SupabaseSessionRepository } from "@/lib/server/infrastructure/supabase-session-repository";

const repository = new SupabaseSessionRepository();

export async function POST(
    request: Request,
    { params }: { params: { session_id: string; question_id: string } }
) {
    try {
        const session = await repository.get(params.session_id);
        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const currentAns = session.answers[params.question_id];
        if (currentAns) {
            // Clear submission state but keep draft
            session.answers[params.question_id] = {
                ...currentAns,
                submittedAt: undefined,
                analysis: undefined
            };

            // If we want to be explicit about status, we could force it, 
            // but the selector derives it.
            // Update: We MUST force it, because Selector logic for REVIEW_FEEDBACK relies on status being 'REVIEWING'
            // if we are clearing analysis. So we must revert to 'IN_SESSION'.
            session.status = "IN_SESSION";
        }

        await repository.update(session);

        return NextResponse.json(session);

    } catch (error) {
        console.error("Retry Failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
