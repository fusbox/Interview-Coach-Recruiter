import { NextResponse } from "next/server";
import { AnalyzeAnswerSchema } from "@/lib/domain/schemas";
import { AIService } from "@/lib/server/services/ai-service";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate Input
        const parseResult = AnalyzeAnswerSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Invalid request", details: parseResult.error.format() },
                { status: 400 }
            );
        }

        const { question, input, blueprint, intakeData } = parseResult.data;

        let answerText: string | null = null;
        let audioData: { base64: string; mimeType: string } | null = null;

        if (typeof input === "string") {
            answerText = input;
        } else if (input && typeof input === "object" && "data" in input && "mimeType" in input) {
            audioData = {
                base64: (input as any).data,
                mimeType: (input as any).mimeType
            };
        } else {
            return NextResponse.json({ error: "Invalid input format" }, { status: 400 });
        }

        // Delegate to Service
        // Adapter: Construct a minimal Question object from the string input
        const questionObj = {
            id: parseResult.data.questionId || "temp",
            text: question,
            category: "General",
            index: 0
        };

        const analysis = await AIService.analyzeAnswer(
            questionObj as any,
            answerText,
            audioData,
            blueprint as any,
            intakeData
        );

        return NextResponse.json(analysis);

    } catch (error) {
        console.error("Analysis API Error:", error);
        return NextResponse.json(
            { error: "Analysis Failed" },
            { status: 500 }
        );
    }
}
