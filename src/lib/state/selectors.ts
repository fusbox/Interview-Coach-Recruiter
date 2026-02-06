import { InterviewSession } from "@/lib/domain/types";
import { NowState, ScreenId } from "./now.types";

export function selectNow(session?: InterviewSession): NowState {
    if (!session) {
        return {
            isLoaded: false,
            status: "NOT_STARTED",
            requiresInitials: false,
            canStart: false,
            isComplete: false,
            currentQuestionIndex: 0,
            totalQuestions: 0,
            screen: "ERROR", // Default to safe error/loading state
        };
    }

    const { status, initialsRequired, candidateName, questions, currentQuestionIndex, answers } = session;

    const hasInitials = !!candidateName;
    const isComplete = status === "COMPLETED";
    const currentQ = questions[currentQuestionIndex];
    const currentAns = currentQ ? answers[currentQ.id] : undefined;

    // Screen Selection Logic (Deterministic Priority)
    let screen: ScreenId = "ERROR";

    if (status === "ERROR") {
        screen = "ERROR";
    } else if (initialsRequired) {
        screen = "INITIALS";
    } else if (status === "NOT_STARTED") {
        screen = "LANDING";
    } else if (status === "COMPLETED") {
        screen = "SUMMARY";
    } else {
        // In-Session Logic
        // In-Session Logic
        // Determine sub-state based on Data, not just Status Enum (which is limited in DB)
        if (currentAns?.analysis) {
            screen = "REVIEW_FEEDBACK";
        } else if (status === "AWAITING_EVALUATION") {
            // Transient state (memory only usually)
            screen = "PENDING_EVALUATION";
        } else if (currentAns?.submittedAt && !currentAns.analysis) {
            // If answer submitted but no analysis, we are effectively pending evaluation
            // This covers the case where DB says "IN_SESSION" but we are waiting for AI
            screen = "PENDING_EVALUATION";
        } else if (status === "REVIEWING") {
            screen = "REVIEW_FEEDBACK";
        } else {
            // Default: User needs to answer
            screen = "ACTIVE_QUESTION";
        }
    }

    return {
        isLoaded: true,
        status,
        role: session.role,
        requiresInitials: initialsRequired,
        canStart: status === "NOT_STARTED",
        isComplete,
        currentQuestionId: currentQ?.id,
        currentQuestionIndex,
        totalQuestions: questions.length,
        screen,
    };
}
