import { NextRequest, NextResponse } from 'next/server';
import { GenerateStrongResponseSchema } from '@/lib/domain/schemas';
import { StrongResponseService } from '@/lib/server/services/strong-response-service';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate request body
        const result = GenerateStrongResponseSchema.safeParse(body);

        if (!result.success) {
            Logger.warn('[API] Invalid Strong Response request', result.error);
            return NextResponse.json(
                { error: 'Invalid request', details: result.error.format() },
                { status: 400 }
            );
        }

        const { question, tips } = result.data;

        // Generate content
        const data = await StrongResponseService.generateStrongResponse(question, tips);

        return NextResponse.json(data);

    } catch (error) {
        Logger.error('[API] Strong Response generation failed', error);
        return NextResponse.json(
            { error: 'Failed to generate strong response' },
            { status: 500 }
        );
    }
}
