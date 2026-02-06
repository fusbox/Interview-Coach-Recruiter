import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Question } from "@/lib/domain/types"
import { MessageSquareText, Send, Activity } from "lucide-react"
import { useSession } from "@/context/SessionContext"
import { useEngagementTracker } from "@/hooks/useEngagementTracker"
import { EngagementDebugOverlay } from "@/components/debug/EngagementDebugOverlay"

interface ActiveQuestionScreenProps {
    question: Question;
    currentQuestionIndex: number;
    totalQuestions: number;
    initialAnswer: string;
    onSaveDraft: (text: string) => void;
    onSubmit: (answer: string) => void;
}

export default function ActiveQuestionScreen({
    question,
    currentQuestionIndex,
    totalQuestions,
    initialAnswer,
    onSaveDraft,
    onSubmit
}: ActiveQuestionScreenProps) {
    const { session, updateSession } = useSession();
    // Use session.id to update. If session is missing, we can't track.

    // Local State
    const [answer, setAnswer] = useState(initialAnswer);
    const lastSaved = useRef(initialAnswer);
    const [isSaving, setIsSaving] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    // Engagement Tracker
    // Note: We don't have isRecording yet in this component (it's text only for now?).
    // The user mentioned "Text input tracking".
    const tracker = useEngagementTracker({
        isEnabled: session?.status !== 'COMPLETED',
        // isContinuousActive: isRecording, // TODO: Connect when Audio is added
        onUpdate: (seconds) => {
            if (session?.id) {
                updateSession(session.id, {
                    engagedTimeSeconds: (session.engagedTimeSeconds || 0) + seconds
                });
            }
        },
    });

    const { trackEvent } = tracker;

    // Auto-Save Effect
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (answer !== lastSaved.current) {
                setIsSaving(true);
                onSaveDraft(answer);
                lastSaved.current = answer;
                setTimeout(() => setIsSaving(false), 800);
            }
        }, 1000);

        return () => clearTimeout(timeout);
    }, [answer, onSaveDraft]);

    // Track Typing (Gap Fill)
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setAnswer(e.target.value);
        trackEvent('tier2', 'typing');
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 relative">
            {/* Header / Progress */}
            <header className="px-6 py-4 border-b bg-white flex justify-between items-center">
                <div className="text-sm font-medium text-muted-foreground select-none" onDoubleClick={() => setShowDebug(prev => !prev)}>
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>
                <div className="flex items-center gap-2 text-primary font-medium">
                    <MessageSquareText className="w-4 h-4" />
                    <span>Interview in Progress</span>
                </div>
            </header>

            <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col gap-6">

                {/* Question Card */}
                <div className="bg-white rounded-xl shadow-sm border p-8 space-y-4">
                    <div className="text-xs uppercase tracking-wide font-semibold text-primary/80">
                        {question.category}
                    </div>
                    <h2 className="text-2xl font-bold leading-tight text-foreground">
                        {question.text}
                    </h2>
                </div>

                {/* Answer Area */}
                <div className="flex-1 flex flex-col gap-2">
                    <label className="sr-only" htmlFor="answer-input">Your Answer</label>
                    <textarea
                        id="answer-input"
                        className="flex-1 w-full rounded-xl border p-6 text-lg/relaxed focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none shadow-sm"
                        placeholder="Type your answer here..."
                        value={answer}
                        onChange={handleTextChange}
                        autoFocus
                    />
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-muted-foreground pl-2 transition-opacity duration-300">
                            {isSaving ? "Saving..." : (answer.length > 0 ? "Saved" : "Start typing...")}
                        </span>
                        <Button
                            size="lg"
                            onClick={() => onSubmit(answer)}
                            disabled={!answer.trim()}
                            className="px-8"
                        >
                            Submit Answer <Send className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </div>

            </main>

            {/* Debug Overlay */}
            <EngagementDebugOverlay
                isVisible={showDebug}
                onClose={() => setShowDebug(false)}
                tracker={tracker}
            />

            {/* Discreet Toggle (Bottom Left Pixel) */}
            <div
                className="fixed bottom-0 left-0 w-4 h-4 opacity-0 z-50 cursor-pointer"
                onClick={() => setShowDebug(true)}
                title="Debug"
            />
        </div>
    )
}
