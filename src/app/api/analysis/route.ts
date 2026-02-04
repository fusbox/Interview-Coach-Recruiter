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

        if (typeof input !== "string") {
            return NextResponse.json({ error: "Audio not supported yet" }, { status: 501 });
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
            input as string,
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
