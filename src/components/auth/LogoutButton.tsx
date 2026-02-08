"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function LogoutButton({ className, collapsed = false }: { className?: string, collapsed?: boolean }) {
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/login');
    };

    return (
        <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn("w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10", className)}
            title="Sign out"
        >
            <LogOut className={cn("w-4 h-4", collapsed ? "mr-0" : "mr-2")} />
            {!collapsed && "Sign out"}
        </Button>
    );
}
