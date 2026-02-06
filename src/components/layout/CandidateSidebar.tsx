import Link from 'next/link';
import { cn } from '@/lib/cn';
import { useSession } from '@/context/SessionContext';
import { usePathname } from 'next/navigation';

interface CandidateSidebarProps {
    className?: string;
    onNavigate?: () => void;
}

export function CandidateSidebar({ className, onNavigate }: CandidateSidebarProps) {
    const { session } = useSession();
    const pathname = usePathname();

    // Safety check: session might be undefined initially
    const candidateName = session?.candidate
        ? `${session.candidate.firstName} ${session.candidate.lastName}`
        : "Candidate";

    const candidateEmail = session?.candidate?.email || "";

    // Helper to check active state
    const isActive = (path: string) => {
        // Simple includes check, but can be more specific if needed
        return pathname?.includes(path);
    };

    // Extract token from session or URL (Assuming token context or param is available via context or we assume relative links)
    // Actually, simple hrefs might be tricky if we don't know the token in the sidebar component without parsing URL.
    // BUT: The session context usually has the ID. The URL has the token. 
    // SAFEST: Use relative links if we are already under /s/[token], or parse from session.

    // Strategy: We can't easily guess the token here if it's not in the session object (Type definition says 'token' is not in InterviewSession, but 'id' is).
    // Let's assume the user is already at `/s/[token]/...`. 
    // We can use a relative link `.` or `coaching` if we are careful, OR better:
    // Parsing the current pathname to preserve the token prefix.

    const getLink = (suffix: string) => {
        // Path format: /s/[token]/[...rest]
        // We want to keep /s/[token] and append suffix (or nothing for root)
        const parts = pathname?.split('/') || [];
        // parts[0] = "", parts[1] = "s", parts[2] = "token"
        if (parts.length >= 3 && parts[1] === 's') {
            const prefix = `/s/${parts[2]}`;
            return suffix ? `${prefix}/${suffix}` : prefix;
        }
        return '#';
    };

    return (
        <aside className={cn("bg-white border-r p-6 h-full flex flex-col", className)}>
            <div className="mb-8">
                <h1 className="font-bold text-xl tracking-tight text-primary">Interview Coach</h1>
            </div>

            <div className="mb-6 pb-6 border-b">
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                    Candidate
                </div>
                <div className="font-medium text-lg text-foreground truncate" title={candidateName}>
                    {candidateName}
                </div>
            </div>

            <nav className="space-y-2 flex-1">
                <Link
                    href={getLink("")}
                    className={cn(
                        "block p-2 rounded font-medium transition-colors hover:bg-slate-100",
                        pathname === getLink("") ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}
                    onClick={onNavigate}
                >
                    Practice Session
                </Link>

                <Link
                    href={getLink("coaching")}
                    className={cn(
                        "block p-2 rounded font-medium transition-colors hover:bg-slate-100",
                        pathname?.includes('/coaching') ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}
                    onClick={onNavigate}
                >
                    Coaching
                </Link>
            </nav>

            <div className="pt-6 mt-auto border-t">
                {/* Consistent Footer Structure */}
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Signed in as
                </div>
                {candidateEmail && (
                    <div className="text-sm font-medium text-foreground truncate" title={candidateEmail}>
                        {candidateEmail}
                    </div>
                )}
            </div>
        </aside>
    );
}
