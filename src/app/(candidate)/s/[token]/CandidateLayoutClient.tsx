"use client";

import { RecruiterSidebar } from '@/components/layout/RecruiterSidebar'; // Typo in plan? Should be CandidateSidebar
import { CandidateSidebar } from '@/components/layout/CandidateSidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { SessionProvider, useSession } from '@/context/SessionContext';
import { InterviewSession } from '@/lib/domain/types';

// Internal component to consume context
function CandidateLayoutContent({ children }: { children: React.ReactNode }) {
    const { session } = useSession();

    const showSidebar = !session?.initialsRequired || !!session?.enteredInitials;

    if (!showSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop Sidebar */}
            <CandidateSidebar className="hidden md:flex w-64 shrink-0 sticky top-0 h-screen" />

            {/* Mobile Sidebar */}
            <MobileSidebar>
                <CandidateSidebar />
            </MobileSidebar>

            {/* Main Content */}
            <main className="flex-1 p-4 pt-16 md:p-8 md:pt-8 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}

interface CandidateLayoutClientProps {
    children: React.ReactNode;
    sessionId?: string;
    initialConfig?: {
        role: string;
        jobDescription?: string;
        candidate?: {
            firstName: string;
            lastName: string;
            email: string;
        }
    };
}

export function CandidateLayoutClient({ children, sessionId, initialConfig }: CandidateLayoutClientProps) {
    return (
        <SessionProvider sessionId={sessionId} initialConfig={initialConfig}>
            <CandidateLayoutContent>
                {children}
            </CandidateLayoutContent>
        </SessionProvider>
    );
}
