import { InterviewSession, Question, SessionStatus } from "@/lib/domain/types";
import { uuidv7 } from "uuidv7";
import { InitSessionSchema } from "@/lib/domain/schemas";
import { z } from "zod";

// --- Pure Domain Functions ---

export function createSession(
    input: z.infer<typeof InitSessionSchema>
): InterviewSession {
    // Validate input (runtime check)
    const data = InitSessionSchema.parse(input);

    const newSession: InterviewSession = {
        id: uuidv7(),
        status: "NOT_STARTED",
        role: data.role,
        jobDescription: data.jobDescription,
        questions: [],
        currentQuestionIndex: 0,
        answers: {},
        initialsRequired: true, // Default policy: always require initials if not authenticated
    };

    return newSession;
}

export function addQuestions(session: InterviewSession, questions: Question[]): InterviewSession {
    return {
        ...session,
        questions: questions
    };
}

export function startSession(session: InterviewSession): InterviewSession {
    if (session.status !== "NOT_STARTED") {
        throw new Error("Session has already started");
    }

    return {
        ...session,
        status: "IN_SESSION",
    };
}

export function nextQuestion(session: InterviewSession): InterviewSession {
    const nextIndex = session.currentQuestionIndex + 1;
    const isComplete = nextIndex >= session.questions.length;

    if (isComplete) {
        return {
            ...session,
            status: "COMPLETED"
        }
    }

    return {
        ...session,
        currentQuestionIndex: nextIndex,
        // Status stays IN_SESSION unless we have logic to pause/review between questions
        // For V1, we assume continuous flow or client-driven pause
    };
}

export function submitAnswer(
    session: InterviewSession,
    questionId: string,
    answerText: string
): InterviewSession {
    // Basic state update - in a real app, this might trigger eval
    const updatedAnswers = {
        ...session.answers,
        [questionId]: {
            questionId,
            transcript: answerText,
            submittedAt: Date.now()
        }
    };

    return {
        ...session,
        answers: updatedAnswers,
        status: "AWAITING_EVALUATION" // Triggers the "Now" selector to show pending screen
    };
}
