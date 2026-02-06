import { SupabaseInviteRepository } from "@/lib/server/infrastructure/supabase-invite-repository";
import { CandidateLayoutClient } from "./CandidateLayoutClient";

export default async function CandidateTokenLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { token: string };
}) {
    const repository = new SupabaseInviteRepository();
    const invite = await repository.getByToken(params.token);

    // If no invite found, we pass undefined to the provider, which might handle it or we let the Page 404.
    // However, the Layout wraps the Page. If the Page 404s, the Layout is still active?
    // Actually, `not-found` boundary.
    // For "demo-invite-token" fallback:
    let initialConfig = undefined;
    let sessionId = undefined;

    if (invite) {
        sessionId = invite.id;
        initialConfig = {
            role: invite.role,
            jobDescription: invite.jobDescription,
            candidate: invite.candidate
        };
    } else if (params.token === 'demo-invite-token') {
        initialConfig = { role: 'Product Manager' };
    }

    return (
        <CandidateLayoutClient sessionId={sessionId} initialConfig={initialConfig}>
            {children}
        </CandidateLayoutClient>
    );
}
