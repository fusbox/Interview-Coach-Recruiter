import { useState, useMemo, useCallback, useEffect } from "react";
import { InterviewSession } from "@/lib/domain/types";
import { selectNow } from "@/lib/state/selectors";

const STORAGE_KEY = "current_session_id";

export function useDomainSession(initialSessionId?: string) {
    const [session, setSession] = useState<InterviewSession | undefined>(undefined);
    const now = useMemo(() => selectNow(session), [session]);

    // 1. Rehydrate on Mount
    useEffect(() => {
        const storedId = localStorage.getItem(STORAGE_KEY);
        const targetId = initialSessionId || storedId;

        if (targetId && !session) {
            // If explicit ID provided and differs from stored, update storage
            if (initialSessionId && initialSessionId !== storedId) {
                localStorage.setItem(STORAGE_KEY, initialSessionId);
            }

            fetch(`/api/session/${targetId}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error("Session not found");
                })
                .then(data => setSession(data))
                .catch(err => {
                    console.warn("Rehydration failed:", err);
                    // Only clear if it was the stored one failing
                    if (!initialSessionId) {
                        localStorage.removeItem(STORAGE_KEY);
                    }
                });
        }
    }, [initialSessionId]); // Depend on initialSessionId

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
            console.log("Submit success, updated session:", updated.status);
            setSession(updated);
        } else {
            console.error("Submit failed:", res.status, res.statusText);
        }
    }, [session, now.currentQuestionId]);

    const submitInitials = useCallback(async (initials: string) => {
        if (!session) return;

        // Optimistic
        setSession(prev => prev ? {
            ...prev,
            enteredInitials: initials,
            initialsRequired: false
        } : undefined);

        await fetch(`/api/session/${session.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enteredInitials: initials, initialsRequired: false })
        });
    }, [session]);

    const saveDraft = useCallback(async (text: string) => {
        if (!session || !now.currentQuestionId) return;

        // Optimistic: Update local session 'answers' map
        // We need to structurally update the specific answer's draft
        setSession(prev => {
            if (!prev) return undefined;
            const qid = now.currentQuestionId!;
            const currentAns = prev.answers[qid] || {};

            return {
                ...prev,
                answers: {
                    ...prev.answers,
                    [qid]: {
                        ...currentAns,
                        questionId: qid,
                        transcript: text // Treat draft as transcript for now or separate field? 
                        // Domain 'Answer' has 'transcript'. If not submitted, it's effectively a draft.
                    }
                }
            };
        });

        // Server Persist
        // We use a specific endpoint or just general session update?
        // Let's use specific answer update endpoint if possible, or generic generic session PATCH?
        // Actually, the simplest is generic session PATCH or a specific answers one.
        // But `SupabaseSessionRepository` iterates ALL answers on update. That's fine for V1.
        // Better: POST to `input` endpoint purely for saving draft.
        // Let's use `api/session/[id]/input` or just reuse `api/session/[id]/questions/[qid]/submit` with `draft=true`?
        // Or generic PATCH on session to update answers.

        // Let's use a new lighter endpoint: PUT /questions/[id]/answer
        // Or reuse existing submit but with "isFinal=false"?
        await fetch(`/api/session/${session.id}/questions/${now.currentQuestionId}/answer`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, isFinal: false })
        });
    }, [session, now.currentQuestionId]);

    const next = useCallback(async () => {
        if (!session) return;
        const nextIdx = session.currentQuestionIndex + 1;
        const isComplete = nextIdx >= session.questions.length;
        const nextStatus = isComplete ? "COMPLETED" : "IN_SESSION";

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

    const retry = useCallback(async () => {
        if (!session || !now.currentQuestionId) return;
        const qid = now.currentQuestionId;

        // Optimistic
        setSession(prev => {
            if (!prev) return undefined;
            const currentAns = prev.answers[qid];
            if (!currentAns) return prev;

            return {
                ...prev,
                status: "IN_SESSION", // Force back to session mode
                answers: {
                    ...prev.answers,
                    [qid]: {
                        ...currentAns,
                        submittedAt: undefined,
                        analysis: undefined
                        // transcript (draft) remains
                    }
                }
            };
        });

        // Server Persist: We need to clear these fields.
        await fetch(`/api/session/${session.id}/questions/${qid}/retry`, {
            method: 'POST'
        });
    }, [session, now.currentQuestionId]);

    const updateSession = useCallback(async (updates: Partial<InterviewSession>) => {
        if (!session) return;

        // Optimistic
        setSession(prev => prev ? { ...prev, ...updates } : undefined);

        await fetch(`/api/session/${session.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    }, [session?.id]);

    return {
        session,
        now,
        actions: {
            init,
            start,
            submit,
            submitInitials,
            saveDraft,
            next,
            retry,
            refresh,
            updateSession
        }
    };
}
