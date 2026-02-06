import Link from 'next/link';
import { cn } from '@/lib/cn';

interface RecruiterSidebarProps {
    className?: string;
    onNavigate?: () => void;
}

export function RecruiterSidebar({ className, onNavigate }: RecruiterSidebarProps) {
    return (
        <aside className={cn("bg-white border-r p-6 h-full flex flex-col", className)}>
            <div className="mb-8">
                <h1 className="font-bold text-xl tracking-tight text-primary">Ready2Work</h1>
            </div>

            <nav className="space-y-2 flex-1">
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                    Recruiter
                </div>

                <Link
                    href="/recruiter/create"
                    className="block p-2 rounded bg-primary/10 text-primary font-medium hover:opacity-90 transition-opacity"
                    onClick={onNavigate}
                >
                    Create Invite
                </Link>

                <Link
                    href="#"
                    className="block p-2 rounded text-muted-foreground hover:bg-slate-100 transition-colors"
                    onClick={onNavigate}
                >
                    My Sessions
                </Link>

                <Link
                    href="#"
                    className="block p-2 rounded text-muted-foreground hover:bg-slate-100 transition-colors"
                    onClick={onNavigate}
                >
                    Candidates
                </Link>
            </nav>

            <div className="pt-6 mt-auto border-t">
                {/* Footer content (Empty for consistency as requested) */}
            </div>
        </aside>
    );
}
