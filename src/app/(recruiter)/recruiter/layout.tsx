import { RecruiterSidebar } from '@/components/layout/RecruiterSidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';

export default function RecruiterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop Sidebar: Hidden on mobile, visible on md+ */}
            <RecruiterSidebar className="hidden md:flex w-64 shrink-0" />

            {/* Mobile Sidebar: Visible logic handled internally (drawer only shows when triggered) */}
            <MobileSidebar>
                <RecruiterSidebar />
            </MobileSidebar>

            {/* Main Content */}
            <main className="flex-1 p-8 pt-16 md:pt-8">
                {children}
            </main>
        </div>
    )
}
