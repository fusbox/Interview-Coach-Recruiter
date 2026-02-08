import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// export const runtime = 'edge'; // Optional: Use edge if compatible, otherwise default to node
// GenAI SDK might rely on Node built-ins, so keeping standard runtime for safety initially.

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
        }

        const body = await request.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ error: "Missing text" }, { status: 400 });
        }

        const ai = new GoogleGenAI({ apiKey });

        // Instruction to ensure clean reading
        const wrappedText = `Instruction: Read the following interview question as a hiring manager addressing a candidate. Tone: Professional, clear, engaging.\n\n"${text}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [{ text: wrappedText }],
            },
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: 'Sulafat',
                        },
                    },
                },
            },
        });

        const candidate = response.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        if (!part?.inlineData?.data) {
            throw new Error("No audio data returned");
        }

        // Return as JSON with Base64 (Simulating stream via client-side playback for V1)
        // True streaming would require piping the response body, but GenAI SDK returns full completion currently for Audio modality in this pattern

        return NextResponse.json({
            audioBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'audio/mpeg'
        });

    } catch (error: any) {
        console.error("TTS API Error:", error);
        return NextResponse.json({ error: error.message || "TTS Failed" }, { status: 500 });
    }
}
