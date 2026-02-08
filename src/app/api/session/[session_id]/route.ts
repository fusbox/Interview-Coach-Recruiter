import { NextResponse } from "next/server";
import { SupabaseSessionRepository } from "@/lib/server/infrastructure/supabase-session-repository";

const repository = new SupabaseSessionRepository();

export async function GET(
    request: Request,
    { params }: { params: { session_id: string } }
) {
    const session = await repository.get(params.session_id);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    return NextResponse.json(session);
}

export async function PATCH(
    request: Request,
    { params }: { params: { session_id: string } }
) {
    const { session_id } = params;

    try {
        const body = await request.json(); // Partial<InterviewSession>

        const session = await repository.get(session_id);
        if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

        // Optimization: If only metadata fields are present, use updateMetadata
        // We define metadata fields as anything NOT 'questions' or 'answers'.
        const isMetadataUpdate = !body.questions && !body.answers;

        const updatedSession = { ...session, ...body };

        if (isMetadataUpdate) {
            await repository.updateMetadata(session_id, body);
        } else {
            await repository.update(updatedSession);
        }

        return NextResponse.json(updatedSession);

    } catch (error) {
        console.error("[API] Session Update PATCH Error:", error);
        return NextResponse.json({ error: "Update failed", details: String(error) }, { status: 500 });
    }
}
