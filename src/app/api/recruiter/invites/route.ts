import { NextResponse } from "next/server";
import { uuidv7 } from "uuidv7";
import { SupabaseInviteRepository } from "@/lib/server/infrastructure/supabase-invite-repository";
import { createClient } from "@/lib/supabase/server";
import { Invite } from "@/lib/domain/invite";
import { z } from "zod";
import { randomBytes } from "crypto";

const repository = new SupabaseInviteRepository();

const CreateInviteSchema = z.object({
    role: z.string().min(1),
    jobDescription: z.string().optional(),
    candidate: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        reqId: z.string().min(1)
    }),
    questions: z.array(z.object({
        text: z.string().min(1),
        category: z.string(),
        index: z.number()
    }))
});

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { role, jobDescription, candidate, questions } = CreateInviteSchema.parse(body);

        // Secure Random Token
        const token = randomBytes(16).toString('hex');
        const sessionId = uuidv7();

        const invite: Invite = {
            id: sessionId,
            token,
            role,
            jobDescription,
            candidate,
            questions,
            createdBy: user.id,
            createdAt: Date.now()
        };

        await repository.create(invite);

        return NextResponse.json({
            invite,
            link: `/s/${token}`
        });

    } catch (error: any) {
        console.error("Invite Create Error:", error);
        return NextResponse.json({
            error: error instanceof z.ZodError ? error.issues : error.message || "Failed to create invite"
        }, { status: 500 });
    }
}
