"use client";

import { useSession } from "../context/SessionContext";
import InitialsScreen from "./InitialsScreen";
import LandingScreen from "./LandingScreen";
import { UnifiedSessionScreen } from "./UnifiedSessionScreen";
// import ActiveQuestionScreen from "./ActiveQuestionScreen"; 
// import ReviewFeedbackScreen from "./ReviewFeedbackScreen";
import SummaryScreen from "./SummaryScreen";
import ErrorScreen from "./ErrorScreen";
import LoadingScreen from "./LoadingScreen";
// import IntakeScreen from "./IntakeScreen";
import SessionSavedScreen from "./SessionSavedScreen";
import { Question } from "@/lib/domain/types";
export default function SessionOrchestrator() {
    const { now, session, startSession, isLoading /*, updateSession */ } = useSession();

    // Computed Context for Screens
    // TODO: Improve cleaner selector access either in Context or Hook
    const currentQ = session?.questions.find((q: Question) => q.id === now.currentQuestionId);
    const currentAns = currentQ && session?.answers ? session.answers[currentQ.id] : undefined;

    console.log(`[Orchestrator] Status: ${now.status}, Screen: ${now.screen}, Analysis?: ${!!currentAns?.analysis}`);

    // Actions Wrapper
    const handleStart = () => startSession("Product Manager"); // Default for V1

    // Render Logic
    if (isLoading && !session) return <LoadingScreen />; // Initial load
    if (now.status === "ERROR") return <ErrorScreen />;
    if (now.status === "PAUSED") return <SessionSavedScreen />;
    if (now.requiresInitials) return <InitialsScreen />;

    if (now.status === "NOT_STARTED") {
        return <LandingScreen onStart={handleStart} role={now.role} />;
    }

    if (now.status === "IN_SESSION" || now.status === "AWAITING_EVALUATION" || now.status === "REVIEWING") {
        // Intake Bypass: We default to tier1 if not set, or just proceed.
        // The IntakeScreen is removed from flow.
        if (!session?.coachingPreference) {
            // Auto-set preference if needed
        }

        if (!currentQ) return <ErrorScreen />;
        return <UnifiedSessionScreen />;
    }

    if (now.status === "COMPLETED") return <SummaryScreen />;

    return <ErrorScreen />;
}
