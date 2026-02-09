import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Question } from "@/lib/domain/types"
import { AnimatePresence, motion } from "framer-motion"
import { useSpeechToText } from "@/hooks/audio/useSpeechToText";
import { useAudioRecording } from "@/hooks/audio/useAudioRecording";
import { useTextToSpeech } from "@/hooks/audio/useTextToSpeech";
import AudioVisualizer from "@/components/audio/AudioVisualizer";
import { Mic, Lightbulb, Volume2, StopCircle, Loader2, X, ArrowRight, Keyboard } from "lucide-react"
import { useSession } from "@/context/SessionContext"
import { EngagementDebugOverlay } from "@/components/debug/EngagementDebugOverlay"
import { cn } from "@/lib/cn"


interface ActiveQuestionScreenProps {
    question: Question;
    currentQuestionIndex: number;
    totalQuestions: number;
    initialAnswer: string;
    onSaveDraft: (text: string) => void;
    onSubmit: (answer: string) => void;
    // New Actions for Revisit/Nav
    retryQuestion: () => void;
    goToQuestion: (index: number) => void;
    nextQuestion: () => void;
}

export default function ActiveQuestionScreen({
    question,
    currentQuestionIndex,
    totalQuestions, // eslint-disable-line @typescript-eslint/no-unused-vars
    initialAnswer,
    onSaveDraft,
    onSubmit,
    retryQuestion,
    goToQuestion,
    nextQuestion
}: ActiveQuestionScreenProps) {
    const {
        session,
        // updateSession, 
        trackEvent,
        engagementDebugEvents,
        // clearDebugEvents,
        isEngagementWindowOpen,
        engagementWindowTimeRemaining
    } = useSession();

    // compute currentAns locally for Revisit Mode logic
    const currentAns = session?.answers[question.id];

    // --- 1. Engagement & State ---
    const [answer, setAnswer] = useState(initialAnswer);
    const lastSaved = useRef(initialAnswer);
    const [isSaving, setIsSaving] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [mode, setMode] = useState<'voice' | 'text'>('voice');
    const [isSubmitting, setIsSubmitting] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

    // --- Audio Hooks ---
    const {
        // isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript: resetDetailedTranscript
    } = useSpeechToText();

    const {
        isRecording,
        isInitializing: isRecordingInitializing,
        startRecording,
        stopRecording,
        mediaStream
    } = useAudioRecording();

    const {
        speak,
        stop: stopSpeaking,
        isPlaying: isSpeaking,
        isLoading: isTTSLoading
    } = useTextToSpeech();

    // Sync transcripts logic
    useEffect(() => {
        if (transcript) {
            setAnswer(prev => { // eslint-disable-line @typescript-eslint/no-unused-vars
                // If the user hasn't typed anything manually (or specifically focused text mode?), replace?
                // For now, let's just use the transcript as the source of truth when listening.
                return transcript;
            });
        }
    }, [transcript]);

    const handleToggleRecording = async () => {
        if (isRecording) {
            trackEvent('tier2', 'mic_stop');
            stopListening();
            await stopRecording();
            // ... (rest of logic)
        } else {
            trackEvent('tier2', 'mic_start');
            setAnswer("");
            resetDetailedTranscript();
            startListening();
            await startRecording();
        }
    };

    const handleTogglePlayback = () => {
        trackEvent('tier2', 'tts_toggle');
        if (isSpeaking) {
            stopSpeaking();
        } else {
            speak(question.text);
        }
    };

    // Hint System State
    const [hintOpen, setHintOpen] = useState(false);
    const [selectedHintCat, setSelectedHintCat] = useState<string | null>(null);

    // Engagement Tracker (Hoisted)
    const hasLoggedEntry = useRef(false);

    // Trigger window open on mount/entry
    useEffect(() => {
        if (session?.status === 'IN_SESSION' && !hasLoggedEntry.current) {
            trackEvent('tier3', 'session_entry');
            hasLoggedEntry.current = true;
        }
    }, [session?.status, trackEvent]); // Run when status confirms we are in session

    // Auto-Save
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

    const handleLocalSubmit = (ans: string) => {
        trackEvent('tier3', 'submit', 60); // 60s window for feedback reading (Tier 3 opens window)
        onSubmit(ans);
    };

    // --- 2. Hint Content Logic ---
    // Mock logic based on Tier
    const tier = session?.coachingPreference || 'tier1';

    const hints = {
        structure: "Start with the situation, then explain your action, and end with the result.",
        outcome: "Focus on what changed because of your actions, not just what you did.",
        focus: "Keep the story centered on your specific contribution."
    };

    const renderHintContent = () => {
        if (tier === 'tier0') {
            return (
                <div className="p-4 bg-amber-50 rounded-lg text-amber-900 text-sm animate-in fade-in">
                    <strong>Tip:</strong> You can focus on one example—what happened, what you did, and what changed.
                </div>
            );
        }

        // Tier 1 & 2
        if (!selectedHintCat) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in">
                    <button onClick={() => { setSelectedHintCat('structure'); trackEvent('tier2', 'hint_click', 45); }} className="text-xs p-2 border rounded hover:bg-slate-50 text-slate-600">Structuring your answer</button>
                    <button onClick={() => { setSelectedHintCat('outcome'); trackEvent('tier2', 'hint_click', 45); }} className="text-xs p-2 border rounded hover:bg-slate-50 text-slate-600">Explaining the outcome</button>
                    <button onClick={() => { setSelectedHintCat('focus'); trackEvent('tier2', 'hint_click', 45); }} className="text-xs p-2 border rounded hover:bg-slate-50 text-slate-600">Staying focused</button>
                </div>
            )
        }

        return (
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-slate-700 text-sm animate-in fade-in">
                <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-blue-900 text-xs uppercase tracking-wider">{selectedHintCat}</span>
                    <button onClick={() => setSelectedHintCat(null)} className="text-xs text-blue-400 hover:text-blue-600">Back</button>
                </div>
                {hints[selectedHintCat as keyof typeof hints]}
            </div>
        )
    };

    // --- 3. Render ---
    return (
        <div className="flex flex-col bg-slate-50 relative selection:bg-emerald-100">

            {/* Header / Nav */}
            <header className="px-6 py-4 border-b bg-white flex justify-between items-center sticky top-0 z-10">
                {/* Left Spacer (matches width of Right Status) - roughly 100px */}
                <div className="hidden sm:block w-[100px]" />

                {/* Question Navigator (Tabs) */}
                <div className="hidden sm:flex flex-1 max-w-2xl mx-auto justify-center items-center gap-1 sm:gap-2 px-4 sm:px-6">
                    {session?.questions.map((q, idx) => {
                        const isCurrent = idx === currentQuestionIndex;
                        const isAnswered = !!session.answers[q.id]?.submittedAt;
                        const firstUnansweredIdx = session.questions.findIndex(qu => !session.answers[qu.id]?.submittedAt);
                        const maxClickable = firstUnansweredIdx === -1 ? session.questions.length - 1 : firstUnansweredIdx;
                        const isClickable = idx <= maxClickable;

                        return (
                            <button
                                key={q.id}
                                onClick={() => { if (isClickable) { trackEvent('tier2', 'nav_click'); goToQuestion(idx); } }}
                                disabled={!isClickable}
                                className={cn(
                                    "flex-1 relative py-2 text-xs font-bold transition-all group",
                                    isClickable && !isCurrent ? "hover:bg-muted/50 rounded-md" : ""
                                )}
                            >
                                <span className={cn(
                                    "relative z-10 px-1",
                                    isCurrent ? "text-blue-600" :
                                        isAnswered ? "text-slate-400" : // Neutral for answered
                                            isClickable ? "text-slate-500" : "text-slate-300"
                                )}>
                                    Q{idx + 1}
                                </span>

                                {/* Underline Indicator */}
                                <div className={cn(
                                    "absolute bottom-0 left-0 right-0 h-0.5 transition-all",
                                    isCurrent ? "bg-blue-600" :
                                        isAnswered ? "bg-emerald-500" : // Green underline for answered
                                            "bg-transparent"
                                )} />
                            </button>
                        );
                    })}
                </div>

                {/* Right: In Session Status (Width locked approx 100px for centering) */}
                <div className="hidden sm:flex w-[100px] justify-end">
                    <div className="flex items-center gap-1.5 opacity-60">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">In Session</span>
                    </div>
                </div>
            </header >

            <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">

                {/* TRANSCRIPT BLOCK (Question Context) */}
                <div className="space-y-4">
                    {/* The Question */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-transparent pl-1"
                        >
                            <div className="flex justify-between items-end mb-2">
                                <div className="text-xs uppercase tracking-wide font-bold text-slate-400">
                                    {question.category}
                                </div>
                                {/* Audio Control - Moved here */}
                                <button
                                    onClick={handleTogglePlayback}
                                    disabled={isTTSLoading}
                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-50 text-[10px] text-blue-600 hover:text-blue-700 uppercase font-bold transition-colors"
                                >
                                    {isTTSLoading ? (
                                        <span className="animate-pulse">Loading...</span>
                                    ) : isSpeaking ? (
                                        <>
                                            <StopCircle size={12} className="animate-pulse text-red-500" /> Stop
                                        </>
                                    ) : (
                                        <>
                                            <Volume2 size={12} /> Read Question
                                        </>
                                    )}
                                </button>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-sans text-slate-800 leading-tight">
                                {question.text}
                            </h2>
                            <p className="text-slate-400 text-sm mt-3 font-medium italic">
                                Take your time.
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* HINT SYSTEM */}
                    {!hintOpen && answer.length === 0 && !currentAns?.submittedAt && (
                        <button
                            onClick={() => setHintOpen(true)}
                            className="text-xs font-medium text-right w-full text-slate-400 hover:text-emerald-600 transition-colors flex items-center justify-start gap-1.5 mt-2"
                        >
                            <Lightbulb className="w-3 h-3" />
                            Need a hint?
                        </button>
                    )}

                    {hintOpen && (
                        <div className="mt-4 animate-in slide-in-from-top-2 duration-300 relative">
                            <button
                                onClick={() => setHintOpen(false)}
                                className="absolute -top-2 -right-2 p-1.5 bg-white/50 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all z-10"
                                aria-label="Close Hint"
                            >
                                <X size={14} />
                            </button>
                            {renderHintContent()}
                        </div>
                    )}
                </div>

                {/* SPACER */}
                <div className="flex-1" />

                {/* INPUT BLOCK vs REVISIT BLOCK */}
                {currentAns?.submittedAt ? (
                    // --- REVISIT MODE ---
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Your Answer</h3>
                            <div className="text-lg text-slate-700 italic font-sans leading-relaxed">
                                "{currentAns.transcript}"
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => {
                                    setAnswer("");
                                    retryQuestion();
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                            >
                                Try My Answer Again
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={() => {
                                    const firstUnanswered = session?.questions.find((_, idx) => {
                                        const qid = session.questions[idx].id;
                                        return !session.answers[qid]?.submittedAt;
                                    });
                                    if (firstUnanswered) {
                                        goToQuestion(firstUnanswered.index);
                                    } else {
                                        nextQuestion();
                                    }
                                }}
                                className="w-full text-slate-400 hover:text-slate-600"
                            >
                                Continue to next question
                            </Button>
                        </div>
                    </div>
                ) : (
                    // --- INPUT MODE ---
                    <div className="relative flex-1 min-h-[400px] flex flex-col w-full">

                        {mode === 'voice' ? (
                            <>
                                {/* Visualizer Layer */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                                    {isRecording && (
                                        <AudioVisualizer
                                            stream={mediaStream}
                                            isRecording={isRecording}
                                            className="w-full h-full max-w-sm bg-transparent"
                                        />
                                    )}
                                </div>

                                {/* Mic Button - Absolute Center of ENTIRE container */}
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <button
                                        onClick={handleToggleRecording}
                                        disabled={isRecordingInitializing || isSubmitting}
                                        className={cn(
                                            "pointer-events-auto group relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
                                            isRecording
                                                ? "bg-red-50 text-red-500 border-4 border-red-200 scale-110"
                                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl"
                                        )}
                                    >
                                        {isRecordingInitializing ? (
                                            <Loader2 className="animate-spin w-8 h-8" />
                                        ) : (
                                            <Mic
                                                size={32}
                                                className={cn(isRecording && "animate-pulse")}
                                            />
                                        )}

                                        {isRecording && (
                                            <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-20"></span>
                                        )}
                                    </button>
                                </div>

                                {/* Status Text - Positioned below center */}
                                <div className="absolute top-1/2 left-0 right-0 pt-16 flex justify-center z-20 pointer-events-none">
                                    <div className="pointer-events-auto text-center space-y-2 max-w-md px-4">
                                        <p className="text-sm font-normal text-slate-400">
                                            {isRecording ? "Listening..." : "Tap the microphone to start recording"}
                                        </p>
                                        <div className="min-h-[60px] flex items-center justify-center">
                                            <p className="text-lg text-slate-700 italic font-sans leading-relaxed line-clamp-3">
                                                {transcript || answer || (isRecording ? "..." : "")}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1" />
                            </>
                        ) : (
                            <div className="relative flex-1 p-4 mb-4">
                                <textarea
                                    className="w-full h-full bg-transparent text-lg text-slate-800 placeholder:text-slate-300 outline-none resize-none"
                                    placeholder="Type your answer here..."
                                    value={answer}
                                    onChange={(e) => {
                                        setAnswer(e.target.value);
                                        if (hintOpen && e.target.value.length > 5) setHintOpen(false);
                                        trackEvent('tier2', 'typing');
                                    }}
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* Actions Footer */}
                        <div className="p-4 flex flex-col items-center gap-4 z-30 relative mt-auto">

                            {/* Next Button */}
                            {answer.trim().length > 0 && (
                                <Button
                                    size="lg"
                                    onClick={() => handleLocalSubmit(answer)}
                                    className="w-full sm:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all animate-in zoom-in-95 duration-200"
                                >
                                    Next <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            )}

                            {/* Saving Indicator */}
                            <div className="h-4">
                                <span className={cn(
                                    "text-[10px] uppercase font-bold tracking-widest transition-colors duration-300",
                                    isSaving ? "text-amber-500" : "opacity-0"
                                )}>
                                    {isSaving ? "Saving..." : ""}
                                </span>
                            </div>

                            {/* Mode Toggle */}
                            <div className="flex items-center gap-1 p-1 bg-slate-200/50 rounded-full backdrop-blur-sm">
                                <button
                                    onClick={() => setMode('voice')}
                                    className={cn(
                                        "p-2 rounded-full transition-all duration-200",
                                        mode === 'voice'
                                            ? "bg-white text-blue-600 shadow-sm scale-110"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                    title="Voice Mode"
                                >
                                    <Mic size={20} />
                                </button>
                                <button
                                    onClick={() => setMode('text')}
                                    className={cn(
                                        "p-2 rounded-full transition-all duration-200",
                                        mode === 'text'
                                            ? "bg-white text-blue-600 shadow-sm scale-110"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                    title="Text Mode"
                                >
                                    <Keyboard size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="h-4" />
            </main>

            {/* Debug Overlay */}
            <EngagementDebugOverlay
                isVisible={showDebug}
                onClose={() => setShowDebug(false)}
                tracker={{
                    totalEngagedSeconds: session?.engagedTimeSeconds || 0,
                    isWindowOpen: isEngagementWindowOpen,
                    trackEvent,
                    debugEvents: engagementDebugEvents,
                    windowTimeRemaining: engagementWindowTimeRemaining,
                    clearDebugEvents: () => console.log("Clear events not hoisted")
                }}
            />
            <div
                className="fixed bottom-0 left-0 w-4 h-4 opacity-0 z-50 cursor-pointer"
                onClick={() => setShowDebug(true)}
                title="Debug"
            />
        </div>
    )
}
