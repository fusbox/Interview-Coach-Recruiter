import { NextResponse } from "next/server";
import { TTSService } from "@/lib/server/services/tts-service";

// export const runtime = 'edge'; // Optional: Use edge if compatible, otherwise default to node
// GenAI SDK might rely on Node built-ins, so keeping standard runtime for safety initially.

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ error: "Missing text" }, { status: 400 });
        }

        const { audioData, mimeType } = await TTSService.generateSpeech(text);

        return new NextResponse(new Uint8Array(audioData), {
            headers: {
                'Content-Type': mimeType,
                'Content-Length': audioData.length.toString(),
            }
        });

    } catch (error: unknown) {
        console.error("TTS API Error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "TTS Failed" }, { status: 500 });
    }
}
