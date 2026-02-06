"use client";

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { InterviewSession, AnalysisResult } from '@/lib/domain/types';
import { NowState, ScreenId } from '@/lib/state/now.types';
import { useDomainSession } from '@/hooks/useDomainSession';

// --- Types (Stubs or Imports) ---
export interface OnboardingIntakeV1 {
    [key: string]: any;
}

export interface SessionContextType {
    // Legacy State (Mapped to Core where possible)
    session?: InterviewSession;
    startSession: (
        role: string,
        jobDescription?: string,
        intakeData?: OnboardingIntakeV1
    ) => Promise<void>;
    submitInitials: (initials: string) => Promise<void>;
    saveDraft: (text: string) => Promise<void>;
    nextQuestion: () => void;
    retryQuestion: () => void;
    goToQuestion: (index: number) => void;
    isLoading: boolean;

    // Stubs for legacy signature compatibility
    loadTipsForQuestion: (questionId: string) => Promise<void>;
    saveAnswer: (
        questionId: string,
        answer: { audioBlob?: Blob; text?: string; analysis: AnalysisResult | null }
    ) => void;
    clearAnswer: (questionId: string) => void;
    updateAnswerAnalysis: (questionId: string, partialAnalysis: Partial<AnalysisResult>) => void;
    finishSession: () => Promise<void>;
    resetSession: () => void;
    audioUrls: Record<string, string>;
    cacheAudioUrl: (questionId: string, url: string) => void;
    updateSession: (sessionId: string, updates: Partial<InterviewSession>) => Promise<void>;

    // Headless Core State (The New Truth)
    now: NowState;
    screen: ScreenId;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export interface SessionProviderProps {
    children: ReactNode;
    sessionId?: string;
    initialConfig?: {
        role: string;
        jobDescription?: string;
        candidate?: {
            firstName: string;
            lastName: string;
            email: string;
        };
    };
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children, sessionId, initialConfig }) => {
    // The Core Hook manages the state
    const { session, now, actions } = useDomainSession(sessionId);

    // Bootstrap on mount
    useEffect(() => {
        if (!now.isLoaded && !sessionId) {
            // Only auto-init new session if we aren't loading an existing one (e.g. via Invite)
            const role = initialConfig?.role || "Product Manager";
            // If we have candidate info in initialConfig, we can't easily pass it to specific init() yet without updating init signature or relying on backend to have it from invite.
            // Actually, if sessionId is provided, useDomainSession fetches it. The initialConfig here is mostly for NEW sessions.
            // But for Invites, the session ALREADY EXISTS in DB (created by Invite logic).
            // So actions.init() is NOT called.
            // The issue is simply that useDomainSession needs to return the candidate data it fetched.
            actions.init(role);
        }
    }, [now.isLoaded, actions, initialConfig, sessionId]);

    // Adapter Logic
    const startSession = async (role: string, jobDescription?: string, intakeData?: OnboardingIntakeV1) => {
        // Transition to IN_SESSION
        actions.start();
    };

    const submitInitials = async (initials: string) => {
        actions.submitInitials(initials);
    };

    const saveDraft = async (text: string) => {
        actions.saveDraft(text);
    };

    const nextQuestion = () => {
        actions.next();
    };

    const retryQuestion = () => {
        actions.retry();
    };

    const saveAnswer = (qid: string, ans: any) => {
        if (ans.text) actions.submit(ans.text);
    };

    // Stubs
    const goToQuestion = (index: number) => console.log("goToQuestion not impl in V1");
    const loadTipsForQuestion = async () => console.log("loadTips not impl in V1");
    const clearAnswer = () => console.log("clearAnswer not impl");
    const updateAnswerAnalysis = () => console.log("updateAnswerAnalysis not impl");
    const finishSession = async () => console.log("finishSession handled by Orchestrator");
    const resetSession = () => console.log("resetSession not impl");
    const cacheAudioUrl = () => { };
    const updateSession = async (sessionId: string, updates: Partial<InterviewSession>) => {
        // We ignore sessionId param here as hook is bound to current session, 
        // but for safety/interface compatibility we keep it.
        // If IDs differ, we might warn, but typically we only update current.
        if (sessionId !== session?.id) console.warn("Context updateSession ID mismatch - updating current anyway");
        await actions.updateSession(updates);
    };

    const contextValue: SessionContextType = {
        session,
        now,
        screen: now.screen,
        startSession,
        submitInitials,
        saveDraft,
        nextQuestion,
        retryQuestion,
        goToQuestion,
        isLoading: !now.isLoaded,
        loadTipsForQuestion,
        saveAnswer,
        clearAnswer,
        updateAnswerAnalysis,
        finishSession,
        resetSession,
        audioUrls: {}, // No audio in V1
        cacheAudioUrl,
        updateSession
    };

    return (
        <SessionContext.Provider value={contextValue}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
