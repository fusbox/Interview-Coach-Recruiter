"use server";

import { getCachedUser } from "@/lib/supabase/server";
import { SupabaseSessionRepository } from "@/lib/server/infrastructure/supabase-session-repository";
import { redirect } from "next/navigation";
import { SessionSummary } from "@/lib/domain/types";

const sessionRepo = new SupabaseSessionRepository();

export async function getRecruiterSessions(): Promise<SessionSummary[]> {
    const user = await getCachedUser();

    if (!user) {
        redirect("/login");
    }

    try {
        return await sessionRepo.listByRecruiter(user.id);
    } catch (error) {
        console.error("Failed to fetch sessions:", error);
        return [];
    }
}
