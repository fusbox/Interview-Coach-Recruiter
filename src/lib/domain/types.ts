export type SessionStatus =
    | 'NOT_STARTED'
    | 'GENERATING_QUESTIONS'
    | 'IN_SESSION'
    | 'AWAITING_EVALUATION'
    | 'REVIEWING'
    | 'COMPLETED'
    | 'ERROR';

export interface Blueprint {
    title: string;
    competencies: Array<{
        id: string;
        title: string;
        description: string;
    }>;
}

/**
 * Canonical Question Entity
 */
export interface Question {
    id: string;
    text: string;
    category: string; // e.g. "Behavioral", "Technical"
    framework?: string; // e.g. "STAR", "Problem-Solving"
    competencyId?: string;
    difficulty?: string;
    index: number; // 0-based index
    tips?: QuestionTips;
}

export interface QuestionTips {
    lookingFor: string;
    pointsToCover: string[];
    answerFramework: string;
    industrySpecifics: {
        metrics: string;
        tools: string;
    };
    mistakesToAvoid: string[];
    proTip: string;
}

/**
 * Canonical Answer Entity
 */
export interface Answer {
    questionId: string;
    transcript?: string; // Final text
    audioUrl?: string; // Optional audio ref
    submittedAt?: number;
    analysis?: AnalysisResult;
    draft?: string;
}

/**
 * Analysis Result (Model Output)
 */
export interface AnalysisResult {
    transcript?: string;

    // Competency Model Signals
    readinessBand: 'RL1' | 'RL2' | 'RL3' | 'RL4';
    confidence?: 'Low' | 'Medium' | 'High';

    // Feedback
    coachReaction: string;
    strengths: string[];
    opportunities: string[];
    missingKeyPoints?: string[];

    // Legacy / Extended Support (Optional)
    strongResponse?: string;
    feedback?: string[]; // Deprecated but might be referenced in legacy files
    rating?: string; // Deprecated
    whyThisWorks?: any;
    keyTerms?: string[];
    deliveryTips?: string[];
    missingElements?: string[];

    // Legacy fields to prevent breaking unknown consumers
    answerScore?: number;
    deliveryStatus?: string;
    evidenceExtracts?: string[];
    biggestUpgrade?: string;
    redoPrompt?: string;
}

/**
 * Canonical Interview Session
 */
export interface InterviewSession {
    id: string;
    candidateName?: string;
    role: string;
    jobDescription?: string;
    status: SessionStatus;

    // The Data
    questions: Question[];
    currentQuestionIndex: number;
    answers: Record<string, Answer>; // Keyed by questionId

    // Minimal config truth
    initialsRequired: boolean;
    enteredInitials?: string;

    // Identity
    candidate?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    engagedTimeSeconds?: number;
}
