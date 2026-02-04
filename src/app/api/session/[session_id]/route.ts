import { NextResponse } from "next/server";
import { FileSessionRepository } from "@/lib/server/infrastructure/file-session-repository";

const repository = new FileSessionRepository();

export async function PATCH(
    request: Request,
    { params }: { params: { session_id: string } }
) {
    const { session_id } = params;

    try {
        const body = await request.json(); // Partial<InterviewSession>

        const session = await repository.get(session_id);
        if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

        // Basic Merge (In real apps, use Domain Functions!)
        // But for V1 "Index/Status" updates, this is acceptable Controller logic
        // Ideally: if (body.status === 'IN_SESSION') session = startSession(session);

        const updatedSession = { ...session, ...body };

        await repository.update(updatedSession);
        return NextResponse.json(updatedSession);

    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
