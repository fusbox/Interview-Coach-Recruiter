import { NextResponse } from "next/server";
import { SupabaseSessionRepository } from "@/lib/server/infrastructure/supabase-session-repository";
import { requireCandidateToken } from "@/lib/server/auth/candidate-token";
import { UpdateSessionSchema } from "@/lib/domain/schemas";

const repository = new SupabaseSessionRepository();

export async function GET(
    request: Request,
    { params }: { params: { session_id: string } }
) {
    const auth = await requireCandidateToken(request, params.session_id);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const session = await repository.get(params.session_id);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    return NextResponse.json(session);
}

export async function PATCH(
    request: Request,
    { params }: { params: { session_id: string } }
) {
    const { session_id } = params;
    const auth = await requireCandidateToken(request, session_id);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const parseResult = UpdateSessionSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Invalid request", details: parseResult.error.format() },
                { status: 400 }
            );
        }
        const updates = parseResult.data;

        const session = await repository.get(session_id);
        if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

        // Optimization: If only metadata fields are present, use updateMetadata
        // We define metadata fields as anything NOT 'questions' or 'answers'.
        const isMetadataUpdate = !('questions' in updates) && !('answers' in updates);

        const updatedSession = { ...session, ...updates };

        if (isMetadataUpdate) {
            await repository.updateMetadata(session_id, updates);
        } else {
            await repository.update(updatedSession);
        }

        return NextResponse.json(updatedSession);

    } catch (error) {
        console.error("[API] Session Update PATCH Error:", error);
        return NextResponse.json({ error: "Update failed", details: String(error) }, { status: 500 });
    }
}
