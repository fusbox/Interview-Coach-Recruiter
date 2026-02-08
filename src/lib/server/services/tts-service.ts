import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export class TTSService {
    static async generateSpeech(text: string): Promise<{ audioBase64: string; mimeType: string }> {
        if (!ai) throw new Error("Missing GEMINI_API_KEY");
        if (!text) throw new Error("Missing text");

        // Limit check
        if (text.length > 800) {
            console.warn("[TTS] Text truncated to 800 chars");
            text = text.substring(0, 800);
        }

        try {
            // 1. Call Gemini for Audio
            const wrapped = `Instruction: Read the following interview question as a hiring manager addressing a candidate. Tone: Professional, clear, slightly encouraging.\n${text}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',

                contents: {
                    parts: [{ text: wrapped }],
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
                throw new Error("Gemini API response missing audio data");
            }

            const mimeType = part.inlineData.mimeType || 'unknown';
            const base64Audio = part.inlineData.data;
            const audioBuffer = Buffer.from(base64Audio, 'base64');

            // Case A: MP3 (send as is)
            if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') {
                return {
                    audioBase64: base64Audio,
                    mimeType: 'audio/mpeg'
                };
            }

            // Case B: Raw PCM (audio/L16) -> Wrap in WAV Header
            if (mimeType.startsWith('audio/L16') || mimeType.startsWith('audio/pcm')) {
                const wavHeader = createWavHeader(audioBuffer.length);
                const wavBuffer = Buffer.concat([wavHeader, audioBuffer]);
                return {
                    audioBase64: wavBuffer.toString('base64'),
                    mimeType: 'audio/wav'
                };
            }

            // Case C: Fallback
            return {
                audioBase64: base64Audio,
                mimeType: mimeType
            };

        } catch (error) {
            console.error("[TTSService] Error:", error);
            throw error;
        }
    }
}

// --- Helper: Create WAV Header ---
// Specs for Gemini Flash TTS: 24kHz, 1 Channel (Mono), 16-bit PCM (Source App Config)
function createWavHeader(dataLength: number) {
    const buffer = Buffer.alloc(44);

    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4); // File size - 8
    buffer.write('WAVE', 8);

    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    buffer.writeUInt16LE(1, 22); // NumChannels (1)
    buffer.writeUInt32LE(24000, 24); // SampleRate (24kHz)
    buffer.writeUInt32LE(24000 * 2, 28); // ByteRate (SampleRate * BlockAlign)
    buffer.writeUInt16LE(2, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample

    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);

    return buffer;
}
