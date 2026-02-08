import { createClient } from '@/lib/supabase/server';
import { RecruiterSidebar } from '@/components/layout/RecruiterSidebar';
import { RecruiterMobileDock } from '@/components/layout/RecruiterMobileDock'; // New Dock
import { ProfileGuard } from '@/components/auth/ProfileGuard';

export default async function RecruiterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // Fetch profile if user exists
    let profile = null;
    if (user) {
        const { data } = await supabase
            .from('recruiter_profiles')
            .select('first_name, last_name') // Minimal select
            .eq('recruiter_id', user.id)
            .single();
        profile = data;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <ProfileGuard />
            {/* Desktop Sidebar: Hidden on mobile, visible on md+ */}
            <RecruiterSidebar
                className="hidden md:flex w-64 shrink-0"
                user={user}
                profile={profile}
            />

            {/* Mobile Dock: Visible on mobile, replaces sidebar */}
            <RecruiterMobileDock />

            {/* Main Content - Add bottom padding for dock on mobile */}
            <main className="flex-1 p-8 pt-8 w-full max-w-full overflow-hidden pb-24 md:pb-8">
                {children}
            </main>
        </div>
    )
}
