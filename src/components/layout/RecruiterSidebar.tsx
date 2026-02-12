"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

import { User } from '@supabase/supabase-js';
import { LogoutButton } from '@/components/auth/LogoutButton';

interface RecruiterProfile {
    first_name: string;
    last_name: string;
    // other fields if needed for sidebar? Phone/Timezone not needed here.
}

interface RecruiterSidebarProps {
    className?: string;
    onNavigate?: () => void;
    user?: User | null;
    profile?: RecruiterProfile | null;
}

export function RecruiterSidebar({ className, onNavigate, user, profile }: RecruiterSidebarProps) {
    const pathname = usePathname();

    // Derived Data
    const displayName = profile?.first_name
        ? `${profile.first_name} ${profile.last_name || ''}`.trim()
        : "Recruiter";
    const displayEmail = user?.email || "recruiter@example.com";

    const isActive = (path: string) => {
        if (path === '/recruiter') {
            return pathname === '/recruiter' || pathname?.startsWith('/recruiter/sessions');
        }
        return pathname === path || pathname?.startsWith(`${path}/`);
    };

    return (
        <aside className={cn("bg-white border-r flex flex-col h-screen sticky top-0", className)}>
            <div className="p-6 pb-0">
                <div className="mb-8">
                    <h1 className="font-bold text-xl tracking-tight text-primary">Ready2Work</h1>
                </div>

                <div className="mb-6 pb-6 border-b">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                        Recruiter
                    </div>
                    <div className="font-medium text-lg text-foreground truncate" title={displayName}>
                        {displayName}
                    </div>
                </div>
            </div>

            <nav className="space-y-2 flex-1 px-6 overflow-y-auto">
                <Link
                    href="/recruiter/create"
                    className={cn(
                        "block p-2 rounded font-medium transition-all duration-200",
                        isActive('/recruiter/create')
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900"
                    )}
                    onClick={onNavigate}
                >
                    Create Invite
                </Link>

                <Link
                    href="/recruiter"
                    className={cn(
                        "block p-2 rounded font-medium transition-all duration-200",
                        isActive('/recruiter')
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900"
                    )}
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

                <Link
                    href="/recruiter/settings"
                    className={cn(
                        "block p-2 rounded font-medium transition-all duration-200",
                        isActive('/recruiter/settings')
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900"
                    )}
                    onClick={onNavigate}
                >
                    Settings
                </Link>
            </nav>

            <div className="p-6 mt-auto border-t">
                {/* Consistent Footer Structure */}
                <div className="flex items-start justify-between">
                    <div className="overflow-hidden mr-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Signed in as
                        </div>
                        <div className="text-sm font-medium text-foreground truncate" title={displayEmail}>
                            {displayEmail}
                        </div>
                    </div>
                    <LogoutButton className="w-auto h-auto p-2" collapsed />
                </div>
            </div>
        </aside>
    );
}
