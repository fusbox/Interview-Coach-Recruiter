import { NextResponse } from "next/server";
import { createSession, addQuestions } from "@/lib/server/session/orchestrator";
import { QuestionService } from "@/lib/server/services/question-service";
import { FileSessionRepository } from "@/lib/server/infrastructure/file-session-repository";
import { InitSessionSchema } from "@/lib/domain/schemas";

// V1: Use File Repository
const repository = new FileSessionRepository();

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Validation
        const parseResult = InitSessionSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Invalid request", details: parseResult.error.format() },
                { status: 400 }
            );
        }

        // 2. Orchestration (Pure Domain)
        let session = createSession(parseResult.data);

        // 3. Service Logic (Question Generation)
        // Decoupled from API route -> delegated to service
        const questions = await QuestionService.generateQuestions(session.role || "General");
        session = addQuestions(session, questions);

        // 4. Persistence
        await repository.create(session);

        return NextResponse.json(session);

    } catch (error) {
        console.error("Link Start Error:", error);
        return NextResponse.json(
            { error: "Failed to start session" },
            { status: 500 }
        );
    }
}
