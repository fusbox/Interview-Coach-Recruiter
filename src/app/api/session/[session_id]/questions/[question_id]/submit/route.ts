import { NextResponse } from "next/server";
import { submitAnswer } from "@/lib/server/session/orchestrator";
import { FileSessionRepository } from "@/lib/server/infrastructure/file-session-repository";

const repository = new FileSessionRepository();

export async function POST(
    request: Request,
    { params }: { params: { session_id: string; question_id: string } }
) {
    const { session_id, question_id } = params;

    try {
        const body = await request.json();
        const { get } = body; // Typically "text" or "input"

        // Input validation could go here
        const answerText = body.text || "";

        // 1. Load Repo
        const session = await repository.get(session_id);
        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // 2. Orchestrate
        const updatedSession = submitAnswer(session, question_id, answerText);

        // 3. Persist
        await repository.update(updatedSession);

        // 4. Return Updated State
        return NextResponse.json(updatedSession);

    } catch (error) {
        console.error("Submit Error:", error);
        return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
    }
}
