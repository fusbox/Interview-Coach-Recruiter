"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async () => {
        setLoading(true);
        setError(null);

        // Client-Side Supabase (needs env vars)
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/recruiter/create");
            router.refresh(); // Refresh to update server cookies
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        setError(null);
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { error } = await supabase.auth.signUp({
            email,
            password
        });
        if (error) {
            setError(error.message);
        } else {
            setError("Check email for confirmation link!");
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Recruiter Login</CardTitle>
                    <CardDescription>Sign in to manage your interview sessions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input
                            className="flex h-10 w-full rounded-md border border-input px-3"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            type="email"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <input
                            className="flex h-10 w-full rounded-md border border-input px-3"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            type="password"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={handleSignUp} disabled={loading}>Sign Up</Button>
                    <Button onClick={handleLogin} disabled={loading}>
                        {loading ? "Signing In..." : "Login"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
