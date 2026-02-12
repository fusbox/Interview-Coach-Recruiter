export interface Details {
    role: string;
    jd: string;
    firstName: string;
    lastName: string;
    candidateEmail: string;
    reqId: string;
}

export interface QuestionInput {
    id: string; // temp id for UI key
    text: string;
    category: string;
    label: string; // Display label (e.g. "Situation")
    isLocked?: boolean; // If structural (STAR/PERMA)
}

export const STAR_TEMPLATE: QuestionInput[] = [
    { id: 's', text: '', category: 'STAR', label: 'Situation', isLocked: true },
    { id: 't', text: '', category: 'STAR', label: 'Task', isLocked: true },
    { id: 'a', text: '', category: 'STAR', label: 'Action', isLocked: true },
    { id: 'r', text: '', category: 'STAR', label: 'Result', isLocked: true },
];

export const PERMA_TEMPLATE: QuestionInput[] = [
    { id: 'p', text: '', category: 'PERMA', label: 'Positive Emotion', isLocked: true },
    { id: 'e', text: '', category: 'PERMA', label: 'Engagement', isLocked: true },
    { id: 'rel', text: '', category: 'PERMA', label: 'Relationships', isLocked: true },
    { id: 'm', text: '', category: 'PERMA', label: 'Meaning', isLocked: true },
    { id: 'acc', text: '', category: 'PERMA', label: 'Accomplishment', isLocked: true },
];

export interface StepFooterProps {
    onBack?: () => void;
    onNext: () => void;
    nextLabel: string | React.ReactNode;
    isNextDisabled?: boolean;
}
