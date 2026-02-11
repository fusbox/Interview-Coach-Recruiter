export type SessionStatus =
    | 'NOT_STARTED'
    | 'GENERATING_QUESTIONS'
    | 'IN_SESSION'
    | 'AWAITING_EVALUATION'
    | 'REVIEWING'
    | 'PAUSED'
    | 'COMPLETED'
    | 'ERROR';

export interface Competency {
    id: string;
    title: string;
    description: string;
    name?: string; // Optional alias for title (tips-service compatibility)
    definition?: string; // Optional alias for description (tips-service compatibility)
}

export interface Blueprint {
    title: string;
    competencies: Competency[];
    readingLevel?: {
        mode?: string;
        maxSentenceWords?: number;
        avoidJargon?: boolean;
    };
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

export interface StrongResponseResult {
    strongResponse: string;
    whyThisWorks: QuestionTips;
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
    retryContext?: {
        trigger: 'user' | 'coach';
        focus?: string;
    };
}

/**
 * Analysis Result (Model Output)
 */
export interface AnalysisResult {
    // New Feedback Schema V2
    ack?: string;
    primaryFocus?: {
        dimension: 'structural_clarity' | 'outcome_explicitness' | 'specificity_concreteness' | 'decision_rationale' | 'focus_relevance' | 'delivery_control';
        headline: string;
        body: string;
    };
    whyThisMatters?: string;
    observations?: string[];
    nextAction?: {
        label: string;
        actionType: 'redo_answer' | 'next_question' | 'practice_example' | 'stop_for_now';
    };
    meta?: {
        tier: 0 | 1 | 2;
        modality: 'text' | 'voice';
        signalQuality: 'insufficient' | 'emerging' | 'reliable' | 'strong';
        confidence: 'low' | 'medium' | 'high';
    };

    transcript?: string;

    // Legacy / Extended Support (Optional - Mapped from V2 where possible or deprecated)
    readinessBand?: 'RL1' | 'RL2' | 'RL3' | 'RL4'; // Deprecated
    confidence?: any; // Deprecated (use meta.confidence)
    coachReaction?: string; // Mapped to ack
    strengths?: string[]; // Deprecated
    opportunities?: string[]; // Deprecated
    missingKeyPoints?: string[];

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
    recruiterId?: string; // Added for ownership check
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
    coachingPreference?: 'tier0' | 'tier1' | 'tier2';

    // Identity
    candidate?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    engagedTimeSeconds?: number;
    intakeData?: any; // Full intake JSON for context
}

export interface SessionSummary {
    id: string;
    candidateName: string;
    role: string;
    status: SessionStatus;
    createdAt: number;
    questionCount: number;
    answerCount: number;
}
