"use client";

import { useSession } from "@/context/SessionContext";
import InitialsScreen from "@/screens/session/InitialsScreen";
import LandingScreen from "@/screens/session/LandingScreen";
import ActiveQuestionScreen from "@/screens/session/ActiveQuestionScreen";
import PendingEvaluationScreen from "@/screens/session/PendingEvaluationScreen";
import ReviewFeedbackScreen from "@/screens/session/ReviewFeedbackScreen";
import SummaryScreen from "@/screens/session/SummaryScreen";
import ErrorScreen from "@/screens/session/ErrorScreen";
import LoadingScreen from "@/screens/session/LoadingScreen";
import IntakeScreen from "@/screens/session/IntakeScreen";
import SessionSavedScreen from "@/screens/session/SessionSavedScreen";

export default function SessionOrchestrator() {
    const { now, session, startSession, nextQuestion, retryQuestion, goToQuestion, saveAnswer, saveDraft, isLoading, updateSession } = useSession();

    // Computed Context for Screens
    // TODO: Improve cleaner selector access either in Context or Hook
    const currentQ = session?.questions.find(q => q.id === now.currentQuestionId);
    const currentAns = currentQ && session?.answers ? session.answers[currentQ.id] : undefined;

    console.log(`[Orchestrator] Status: ${now.status}, Screen: ${now.screen}, Analysis?: ${!!currentAns?.analysis}`);

    // Actions Wrapper
    const handleStart = () => startSession("Product Manager"); // Default for V1
    const handleSubmit = (text: string) => saveAnswer(now.currentQuestionId || "", { text, analysis: null });

    // Render Logic
    if (isLoading && !session) return <LoadingScreen />; // Initial load
    if (now.status === "ERROR") return <ErrorScreen />;
    if (now.status === "PAUSED") return <SessionSavedScreen />;
    if (now.requiresInitials) return <InitialsScreen />;

    if (now.status === "NOT_STARTED") {
        return <LandingScreen onStart={handleStart} role={now.role} />;
    }

    if (now.status === "IN_SESSION") {
        // New Intake Step
        if (!session?.coachingPreference) {
            return <IntakeScreen onComplete={(pref: 'tier0' | 'tier1' | 'tier2') => updateSession(session!.id, { coachingPreference: pref })} />;
        }

        if (!currentQ) return <ErrorScreen />;
        return (
            <ActiveQuestionScreen
                question={currentQ}
                currentQuestionIndex={now.currentQuestionIndex}
                totalQuestions={now.totalQuestions}
                initialAnswer={currentAns?.transcript || ""}
                onSaveDraft={saveDraft}
                onSubmit={handleSubmit}
                retryQuestion={retryQuestion}
                goToQuestion={goToQuestion}
                nextQuestion={nextQuestion}
            />
        );
    }

    if (now.status === "AWAITING_EVALUATION") return <PendingEvaluationScreen />;

    if (now.status === "REVIEWING") {
        if (!currentQ) return <ErrorScreen />;
        return (
            <ReviewFeedbackScreen />
        );
    }

    if (now.status === "COMPLETED") return <SummaryScreen />;

    return <ErrorScreen />;
}
