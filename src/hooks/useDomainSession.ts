import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { InterviewSession } from "@/lib/domain/types";
import { selectNow } from "@/lib/state/selectors";

const STORAGE_KEY = "current_session_id";
const TOKEN_HEADER = "x-candidate-token";

export function useDomainSession(initialSessionId?: string, candidateToken?: string) {
    const [session, setSession] = useState<InterviewSession | undefined>(undefined);
    const now = useMemo(() => selectNow(session), [session]);
    const isSubmittingRef = useRef(false);

    const buildHeaders = useCallback(
        (includeJson = true) => {
            const headers: Record<string, string> = {};
            if (includeJson) {
                headers["Content-Type"] = "application/json";
            }
            if (candidateToken) {
                headers[TOKEN_HEADER] = candidateToken;
            }
            return headers;
        },
        [candidateToken]
    );

    // 1. Rehydrate on Mount
    useEffect(() => {
        const storedId = localStorage.getItem(STORAGE_KEY);
        const targetId = initialSessionId || storedId;

        if (targetId && !session) {
            // If explicit ID provided and differs from stored, update storage
            if (initialSessionId && initialSessionId !== storedId) {
                localStorage.setItem(STORAGE_KEY, initialSessionId);
            }

            fetch(`/api/session/${targetId}`, {
                headers: buildHeaders(false)
            })
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
    }, [initialSessionId, buildHeaders, session]); // Depend on initialSessionId

    // Actions
    const init = useCallback(async (role: string) => {
        try {
            const response = await fetch('/api/session/start', {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify({ role })
            });

            if (!response.ok) throw new Error("Failed to start session");

            const newSession = await response.json();
            setSession(newSession);
            localStorage.setItem(STORAGE_KEY, newSession.id);
        } catch (e) {
            console.error("Session Init Failed", e);
        }
    }, [buildHeaders]);

    const refresh = useCallback(async () => {
        if (!session?.id) return;
        const res = await fetch(`/api/session/${session.id}`, {
            headers: buildHeaders(false)
        });
        if (res.ok) setSession(await res.json());
    }, [session?.id, buildHeaders]);

    const start = useCallback(async () => {
        if (!session) return;
        // Optimistic UI Update
        setSession(prev => prev ? { ...prev, status: "IN_SESSION" } : undefined);

        await fetch(`/api/session/${session.id}`, {
            method: 'PATCH',
            headers: buildHeaders(),
            body: JSON.stringify({ status: "IN_SESSION" })
        });
    }, [session, buildHeaders]);

    const submit = useCallback(async (answerText: string) => {
        if (!session || !now.currentQuestionId) return;
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        // Optimistic Update: Immediately transition to AWAITING_EVALUATION to show loader
        setSession(prev => {
            if (!prev) return undefined;
            const qid = now.currentQuestionId!;
            return {
                ...prev,
                status: "AWAITING_EVALUATION",
                answers: {
                    ...prev.answers,
                    [qid]: {
                        ...prev.answers[qid],
                        questionId: qid,
                        transcript: answerText,
                        submittedAt: Date.now(),
                        analysis: null,
                        draft: undefined
                    }
                }
            };
        });

        // But for V1, let's wait for the response to ensure persistence.
        const res = await fetch(`/api/session/${session.id}/questions/${now.currentQuestionId}/submit`, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify({ text: answerText })
        });

        try {
            if (res.ok) {
                const updated = await res.json();
                console.log("Submit success, updated session:", updated.status);
                setSession(updated);
            } else {
                console.error("Submit failed:", res.status, res.statusText);
                // Ideally rollback status here, but for V1 we leave it or rely on user refresh
            }
        } finally {
            isSubmittingRef.current = false;
        }
    }, [session, now.currentQuestionId, buildHeaders]);

    const analyzeCurrentQuestion = useCallback(async () => {
        if (!session || !now.currentQuestionId) return;

        const res = await fetch(`/api/session/${session.id}/questions/${now.currentQuestionId}/analysis`, {
            method: 'POST',
            headers: buildHeaders(false)
        });

        if (res.ok) {
            const updated = await res.json();
            setSession(updated);
        } else {
            console.error("Analysis trigger failed:", res.status, res.statusText);
        }
    }, [session, now.currentQuestionId, buildHeaders]);

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
            headers: buildHeaders(),
            body: JSON.stringify({ enteredInitials: initials, initialsRequired: false })
        });
    }, [session, buildHeaders]);

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
                        draft: text
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
        const url = `/api/session/${session.id}/questions/${now.currentQuestionId}/answer`;
        console.log(`[useDomainSession] saveDraft -> PUT ${url}`);

        await fetch(url, {
            method: 'PUT',
            headers: buildHeaders(),
            body: JSON.stringify({ text, isFinal: false })
        }).catch(e => console.error("[useDomainSession] saveDraft Error:", e));
    }, [session, now.currentQuestionId, buildHeaders]);

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
            headers: buildHeaders(),
            body: JSON.stringify({
                currentQuestionIndex: nextIdx,
                status: nextStatus
            })
        });
    }, [session, buildHeaders]);

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
            method: 'POST',
            headers: buildHeaders(false)
        });
    }, [session, now.currentQuestionId, buildHeaders]);

    const goToQuestion = useCallback(async (index: number) => {
        if (!session) return;

        // Validation: Can only go to questions up to the first unanswered one (furthest progress)
        // Find the index of the first question that has NO submittedAt
        // Actually, we iterate.
        let maxAllowed = 0;
        for (let i = 0; i < session.questions.length; i++) {
            const q = session.questions[i];
            const ans = session.answers[q.id];
            if (ans?.submittedAt) {
                maxAllowed = i + 1;
            } else {
                // This is the first unanswered one.
                maxAllowed = i;
                break;
            }
        }

        // Edge case: If all are answered, maxAllowed is length - 1 (or length? depending on if we have a summary screen?)
        // If we want to allow going to any question if all are answered:
        if (session.answers[session.questions[session.questions.length - 1].id]?.submittedAt) {
            maxAllowed = session.questions.length - 1;
        }

        if (index < 0 || index > maxAllowed) {
            console.warn(`[useDomainSession] goToQuestion blocked: ${index} > ${maxAllowed}`);
            return;
        }

        // Optimistic
        setSession(prev => prev ? {
            ...prev,
            currentQuestionIndex: index,
            status: "IN_SESSION"
        } : undefined);

        await fetch(`/api/session/${session.id}`, {
            method: 'PATCH',
            headers: buildHeaders(),
            body: JSON.stringify({ currentQuestionIndex: index })
        });
    }, [session, buildHeaders]);

    const updateSession = useCallback(async (updates: Partial<InterviewSession>) => {
        if (!session) return;

        // Optimistic
        setSession(prev => prev ? { ...prev, ...updates } : undefined);

        await fetch(`/api/session/${session.id}`, {
            method: 'PATCH',
            headers: buildHeaders(),
            body: JSON.stringify(updates)
        });
    }, [session?.id, buildHeaders]);

    const reset = useCallback(async () => {
        if (!session) return;

        // Optimistic: Clear answers, reset index, status IN_SESSION
        setSession(prev => prev ? {
            ...prev,
            status: "IN_SESSION",
            currentQuestionIndex: 0,
            answers: {} // Clear all answers
        } : undefined);

        await fetch(`/api/session/${session.id}/reset`, {
            method: 'POST',
            headers: buildHeaders(false)
        });
    }, [session?.id, buildHeaders]);

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
            goToQuestion,
            refresh,
            goToQuestion,
            refresh,
            analyzeCurrentQuestion,
            updateSession,
            reset
        }
    };
}
