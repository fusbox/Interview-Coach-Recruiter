import { useState, useMemo, useCallback, useEffect } from "react";
import { InterviewSession } from "@/lib/domain/types";
import { selectNow } from "@/lib/state/selectors";

const STORAGE_KEY = "current_session_id";

export function useDomainSession() {
    const [session, setSession] = useState<InterviewSession | undefined>(undefined);
    const now = useMemo(() => selectNow(session), [session]);

    // 1. Rehydrate on Mount
    useEffect(() => {
        const storedId = localStorage.getItem(STORAGE_KEY);
        if (storedId && !session) {
            fetch(`/api/session/${storedId}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error("Session not found"); // likely deleted on server, or file cache cleared
                })
                .then(data => setSession(data))
                .catch(err => {
                    console.warn("Rehydration failed:", err);
                    localStorage.removeItem(STORAGE_KEY);
                });
        }
    }, []); // Run once

    // Actions
    const init = useCallback(async (role: string) => {
        try {
            const response = await fetch('/api/session/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            });

            if (!response.ok) throw new Error("Failed to start session");

            const newSession = await response.json();
            setSession(newSession);
            localStorage.setItem(STORAGE_KEY, newSession.id);
        } catch (e) {
            console.error("Session Init Failed", e);
        }
    }, []);

    const refresh = useCallback(async () => {
        if (!session?.id) return;
        const res = await fetch(`/api/session/${session.id}`);
        if (res.ok) setSession(await res.json());
    }, [session?.id]);

    const start = useCallback(async () => {
        if (!session) return;
        // Optimistic UI Update
        setSession(prev => prev ? { ...prev, status: "IN_SESSION" } : undefined);

        await fetch(`/api/session/${session.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: "IN_SESSION" })
        });
    }, [session]);

    const submit = useCallback(async (answerText: string) => {
        if (!session || !now.currentQuestionId) return;

        // Optimistic Update? No, wait for server processing/ack usually.
        // But for V1, let's wait for the response to ensure persistence.
        const res = await fetch(`/api/session/${session.id}/questions/${now.currentQuestionId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: answerText })
        });

        if (res.ok) {
            const updated = await res.json();
            setSession(updated);
        }
    }, [session, now.currentQuestionId]);

    const next = useCallback(async () => {
        if (!session) return;
        const nextIdx = session.currentQuestionIndex + 1;
        const isComplete = nextIdx >= session.questions.length;
        const nextStatus = isComplete ? "COMPLETED" : "IN_SESSION"; // Handle status transition logic on client for V1 Patch

        // Optimistic
        setSession(prev => prev ? {
            ...prev,
            currentQuestionIndex: nextIdx,
            status: nextStatus as any
        } : undefined);

        await fetch(`/api/session/${session.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentQuestionIndex: nextIdx,
                status: nextStatus
            })
        });
    }, [session]);

    return {
        session,
        now,
        actions: {
            init,
            start,
            submit,
            next,
            refresh
        }
    };
}
