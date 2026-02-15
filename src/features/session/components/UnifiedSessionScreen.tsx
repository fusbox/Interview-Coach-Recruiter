import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../context/SessionContext';
import { useSmartHints } from '../hooks/useSmartHints';
import { useStrongResponse } from '../hooks/useStrongResponse';
import { useSpeechToText } from '@/features/audio/hooks/useSpeechToText';
import { useAudioRecording } from "@/features/audio/hooks/useAudioRecording";
import { useTextToSpeech } from "@/features/audio/hooks/useTextToSpeech";
import { SessionHeader } from './SessionHeader';
import { FeedbackDrawer } from './FeedbackDrawer';
import AudioVisualizer from '@/features/audio/components/AudioVisualizer';
import { TipsAccordion } from './TipsAccordion';
import { StrongResponseAccordion } from './StrongResponseAccordion';
import { Button } from '@/components/ui/button';
import {
    Mic,
    Keyboard,
    ArrowRight,
    StopCircle,
    Loader2,
    Lightbulb,
    Sparkles,
    X,
    Play
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoryTooltip } from './CategoryTooltip';
import { EngagementDebugOverlay } from '@/components/debug/EngagementDebugOverlay';

export default function UnifiedSessionScreen() {
    const router = useRouter();
    const {
        session,
        saveAnswer,
        nextQuestion,
        retryQuestion,
        trackEvent,
        isEngagementWindowOpen,
        engagementDebugEvents,
        engagementWindowTimeRemaining,
        clearDebugEvents
    } = useSession();

    // Derived State from context
    const currentQuestionIndex = session?.currentQuestionIndex ?? 0;
    const isReviewing = session?.status === 'REVIEWING';
    const isThinking = session?.status === 'AWAITING_EVALUATION';
    const currentQuestionId = session?.questions[currentQuestionIndex]?.id;
    const analysis = currentQuestionId ? session?.answers[currentQuestionId]?.analysis : undefined;
    const hasSubmitted = currentQuestionId ? !!session?.answers[currentQuestionId]?.submittedAt : false;
    const currentQuestion = session?.questions[currentQuestionIndex];

    // Input States
    const [mode, setMode] = useState<'voice' | 'text'>('voice');
    const [answerText, setAnswerText] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [hintOpen, setHintOpen] = useState(false);
    const [strongResponseOpen, setStrongResponseOpen] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Hooks
    const { hints, isLoading: isHintLoading, fetchHints } = useSmartHints(
        currentQuestion!,
        session?.role || "Product Manager",
        undefined
    );
    const { data: strongResponseData, isLoading: isStrongResponseLoading, fetchStrongResponse } = useStrongResponse(
        currentQuestionId!,
        currentQuestion?.text ?? "",
        hints
    );
    const { transcript, resetTranscript, startListening, stopListening } = useSpeechToText();
    const {
        isRecording,
        isInitializing: isRecordingInitializing,
        startRecording,
        stopRecording,
        warmUp,
        resetAudio,
        mediaStream,
        audioBlob
    } = useAudioRecording();

    const {
        isPlaying,
        isLoading: isTTSLoading,
        speak,
        stop: stopSpeaking,
        prefetch
    } = useTextToSpeech();

    // Effects
    useEffect(() => {
        if (isReviewing) {
            setIsDrawerOpen(true);
        }
    }, [isReviewing]);

    // Mic Warm-up Optimization
    useEffect(() => {
        if (mode === 'voice' && !isRecording) {
            warmUp();
        }
    }, [mode, isRecording, warmUp]);

    // Auto-play question audio on entry
    useEffect(() => {
        if (currentQuestion && !hasSubmitted) {
            speak(currentQuestion.text, currentQuestion.id);
        }
        // Prefetch next question audio
        if (session?.questions) {
            const nextIdx = currentQuestionIndex + 1;
            if (nextIdx < session.questions.length) {
                const nextQ = session.questions[nextIdx];
                prefetch(nextQ.id, nextQ.text);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestionIndex]);

    // Handlers
    const handleTogglePlayback = async () => {
        if (!currentQuestion) return;
        if (isPlaying) {
            stopSpeaking();
        } else {
            speak(currentQuestion.text, currentQuestion.id);
        }
    };

    const handleToggleRecording = async () => {
        if (isRecording) {
            await stopRecording();
            stopListening();
        } else {
            await startRecording();
            startListening();
        }
    };

    const handleSubmit = async () => {
        const finalAnswer = mode === 'voice' ? (transcript || answerText) : answerText;
        if (!finalAnswer.trim()) return;

        trackEvent('tier3', 'answer_submit');
        if (currentQuestionId) {
            saveAnswer(currentQuestionId, {
                text: finalAnswer,
                analysis: null,
                transcript: mode === 'voice' ? finalAnswer : undefined
            });
        }

        // Cleanup local states
        if (mode === 'text') {
            resetTranscript();
            resetAudio();
        } else {
            setAnswerText('');
        }
    };

    const handleRetry = () => {
        setIsDrawerOpen(false);
        setAnswerText('');
        resetTranscript();
        resetAudio();
        retryQuestion({ trigger: 'user' });
        trackEvent('tier2', 'session_retry_question');
    };

    const handleNext = () => {
        setIsDrawerOpen(false);
        setAnswerText('');
        resetTranscript();
        resetAudio();
        nextQuestion();
    };

    const handleStop = async () => {
        if (window.confirm("Are you sure you want to stop? Your progress is saved.")) {
            trackEvent('tier2', 'session_stop_early');
            router.push('/dashboard');
        }
    };

    const handleTextareaFocus = () => {
        setTimeout(() => {
            textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    if (!session || !currentQuestion) return null;

    // Derived State for Answer Review
    const answerData = session.answers[currentQuestion.id] || {};

    return (
        <div className="flex flex-col h-screen bg-background relative">
            <SessionHeader />

            <main className="flex-1 w-full flex flex-row overflow-hidden relative">
                {/* LEFT: Main Workspace */}
                <div className="flex-1 flex flex-col items-center transition-all duration-700 ease-in-out overflow-y-auto">
                    <div className="w-full max-w-4xl flex flex-col">
                        {/* 1. TOP: Question Card Area */}
                        <div
                            className={cn(
                                "grow-0 shrink-0 p-4 md:p-6 lg:p-10 w-full transition-all duration-500 ease-in-out cursor-default",
                                isReviewing ? "opacity-30 scale-[0.98] pointer-events-none blur-sm" : "opacity-100 scale-100"
                            )}>
                            <div className="glass-card text-slate-900 dark:text-white rounded-3xl p-6 md:p-10 w-full relative overflow-hidden transition-all duration-300 ring-1 ring-white/20 bg-gradient-to-br from-[#e8f1fd] to-[#d1e3fa]">
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 to-blue-600" />

                                <div className="flex justify-start mb-6">
                                    <CategoryTooltip category={currentQuestion.category}>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-deep text-[10px] font-bold uppercase tracking-wider text-white cursor-help transition-colors">
                                            {currentQuestion.category.toUpperCase()}
                                        </span>
                                    </CategoryTooltip>
                                </div>

                                <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight text-left mb-10 text-slate-900 dark:text-white font-display">
                                    {currentQuestion.text}
                                </h2>

                                <div className="flex items-center gap-4 min-h-[40px] w-auto pt-6 pb-6 md:pb-10 -mx-6 md:-mx-10 -mb-6 md:-mb-10 px-6 md:px-10 border-t-2 border-slate-500/10 dark:border-white/10 bg-blue-900/[0.03] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                                    <div className="flex-1 flex justify-start gap-4">
                                        {!hasSubmitted && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        if (hintOpen) {
                                                            setHintOpen(false);
                                                        } else {
                                                            setHintOpen(true);
                                                            setStrongResponseOpen(false);
                                                            if (!hints) fetchHints();
                                                        }
                                                    }}
                                                    className={cn(
                                                        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                                                        hintOpen
                                                            ? "bg-blue-600 text-white shadow-lg"
                                                            : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                                    )}
                                                >
                                                    <Lightbulb size={18} /> <span>Hints</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (strongResponseOpen) {
                                                            setStrongResponseOpen(false);
                                                        } else {
                                                            setStrongResponseOpen(true);
                                                            setHintOpen(false);
                                                            if (!strongResponseData) fetchStrongResponse();
                                                        }
                                                    }}
                                                    className={cn(
                                                        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                                                        strongResponseOpen
                                                            ? "bg-purple-600 text-white shadow-lg"
                                                            : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                                                    )}
                                                >
                                                    <Sparkles size={18} /> <span>Example</span>
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex-none flex justify-center items-center gap-3">
                                        {!isReviewing && !hasSubmitted && (
                                            <div className="bg-white/30 dark:bg-white/10 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-md border border-white/30 dark:border-white/10">
                                                <button
                                                    onClick={() => {
                                                        setMode('voice');
                                                        setAnswerText('');
                                                    }}
                                                    className={cn(
                                                        "p-2 px-3 rounded-full transition-all flex items-center justify-center gap-2",
                                                        mode === 'voice'
                                                            ? "bg-blue-600 text-white shadow-md ring-1 ring-blue-600 border-none outline-none"
                                                            : "text-blue-600 hover:text-blue-900"
                                                    )}
                                                    title="Voice Mode"
                                                >
                                                    <Mic size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setMode('text');
                                                        resetTranscript();
                                                        resetAudio();
                                                    }}
                                                    className={cn(
                                                        "p-2 px-3 rounded-full transition-all flex items-center justify-center gap-2",
                                                        mode === 'text'
                                                            ? "bg-blue-600 text-white shadow-md ring-1 ring-blue-600 border-none outline-none"
                                                            : "text-blue-600 hover:text-blue-900"
                                                    )}
                                                    title="Text Mode"
                                                >
                                                    <Keyboard size={18} />
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleTogglePlayback}
                                            disabled={isTTSLoading}
                                            className="p-3 rounded-2xl bg-white/30 dark:bg-white/5 backdrop-blur-md shadow-md border border-white/30 hover:bg-slate-50 dark:hover:bg-white/10 text-primary dark:text-slate-300 transition-all dark:border-white/5"
                                            aria-label={isPlaying ? "Stop reading" : "Read question"}
                                        >
                                            {isPlaying ? <StopCircle size={18} className="animate-pulse text-red-500" /> : <Play size={18} />}
                                        </button>
                                    </div>

                                    <div className="flex-1 flex justify-end" />
                                </div>
                            </div>
                        </div>

                        {/* 2. BOTTOM: Interaction Area */}
                        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:p-10 py-1 md:py-2 w-full min-h-0 relative">
                            {!isReviewing && !hasSubmitted && (
                                <div className="w-full h-full flex items-center justify-center">
                                    {mode === 'voice' ? (
                                        <div className="h-48 w-full flex items-center justify-center pb-8">
                                            {isRecording && (
                                                <AudioVisualizer
                                                    stream={mediaStream}
                                                    isRecording={isRecording}
                                                    className="w-full h-full"
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col pb-0">
                                            <textarea
                                                ref={textareaRef}
                                                className="flex-1 w-full bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-10 resize-none outline-none text-lg md:text-xl text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 font-medium shadow-sm min-h-[300px] backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                placeholder="Type your answer here..."
                                                value={answerText}
                                                onChange={(e) => setAnswerText(e.target.value)}
                                                onFocus={handleTextareaFocus}
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {(isReviewing || hasSubmitted) && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    <div className="w-20 h-20 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-2 rotate-3 border border-blue-500/20 shadow-inner">
                                        <ArrowRight size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Answer Submitted</h3>
                                        <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Awaiting coaching feedback...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer: Inside main column so it squeezes with sidebar */}
                        <footer className="shrink-0 bg-white/40 dark:bg-black/20 backdrop-blur-md border-t border-slate-100 dark:border-white/5">
                            <div className="w-full px-4 md:px-6 lg:px-10 py-2 md:py-3 pb-4 md:pb-6">
                                {!isReviewing && !hasSubmitted ? (
                                    mode === 'voice' ? (
                                        <div className="flex flex-col items-center justify-center gap-6">
                                            <div className="relative flex justify-center items-center">
                                                {(!audioBlob || isRecording) && (
                                                    <button
                                                        onClick={handleToggleRecording}
                                                        disabled={isRecordingInitializing}
                                                        className={cn(
                                                            "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl",
                                                            isRecording
                                                                ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-4 border-red-100 dark:border-red-900/40"
                                                                : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                                                        )}
                                                    >
                                                        {isRecordingInitializing ? (
                                                            <Loader2 className="animate-spin w-8 h-8" />
                                                        ) : (
                                                            <Mic size={32} className={cn(isRecording && "animate-pulse")} />
                                                        )}
                                                    </button>
                                                )}

                                                {!isRecording && audioBlob && (
                                                    <div className="flex gap-4 items-center animate-in fade-in zoom-in duration-300">
                                                        <Button
                                                            onClick={() => { resetTranscript(); resetAudio(); }}
                                                            variant="outline"
                                                            className="px-8 h-14 rounded-2xl bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
                                                        >
                                                            Retry
                                                        </Button>
                                                        <Button
                                                            onClick={handleSubmit}
                                                            className="px-10 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg font-bold"
                                                        >
                                                            Submit Answer
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                                                {isRecording ? "Listening..." : transcript ? "Check your response above" : "Tap to Speak"}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={!answerText.trim()}
                                                className="px-8 h-16 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl rounded-2xl font-bold"
                                            >
                                                Submit Answer <ArrowRight className="ml-2 w-5 h-5" />
                                            </Button>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                                        <Button
                                            onClick={handleRetry}
                                            variant="outline"
                                            className="w-full md:w-auto px-10 h-16 rounded-2xl border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                                        >
                                            Try Again
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            className="w-full md:w-auto px-12 h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl text-xl font-bold"
                                        >
                                            Next Question
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </footer>
                    </div>
                </div>

                {/* RIGHT: Resource Side Panel (lg only) */}
                <AnimatePresence>
                    {(hintOpen || strongResponseOpen) && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "33.333%", opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 200 }}
                            className="hidden lg:flex flex-col border-l border-slate-200 dark:border-white/5 glass-overlay overflow-hidden shadow-2xl"
                        >
                            <div className="min-w-[400px] h-full flex flex-col">
                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                hintOpen ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
                                            )}>
                                                {hintOpen ? <Lightbulb size={24} /> : <Sparkles size={24} />}
                                            </div>
                                            <h3 className="text-xl font-bold dark:text-white">
                                                {hintOpen ? "Interview Tips" : "Strong Response"}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => { setHintOpen(false); setStrongResponseOpen(false); }}
                                            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-400"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {hintOpen && <TipsAccordion tips={hints} isLoading={isHintLoading} />}
                                    {strongResponseOpen && (
                                        <StrongResponseAccordion
                                            data={strongResponseData}
                                            isLoading={isStrongResponseLoading}
                                        />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Overlay */}
                <AnimatePresence>
                    {(hintOpen || strongResponseOpen) && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="lg:hidden w-full absolute bottom-0 left-0 right-0 glass-overlay border-t border-slate-200 dark:border-white/5 overflow-hidden z-30"
                        >
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm uppercase tracking-wider text-slate-400">
                                        {hintOpen ? "Hints" : "Example"}
                                    </span>
                                    <button onClick={() => { setHintOpen(false); setStrongResponseOpen(false); }}><X size={18} /></button>
                                </div>
                                {hintOpen && <TipsAccordion tips={hints} isLoading={isHintLoading} />}
                                {strongResponseOpen && (
                                    <StrongResponseAccordion
                                        data={strongResponseData}
                                        isLoading={isStrongResponseLoading}
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <FeedbackDrawer
                isOpen={isDrawerOpen}
                analysis={analysis}
                isThinking={isThinking}
                onNext={handleNext}
                onRetry={handleRetry}
                onClose={() => setIsDrawerOpen(false)}
                onStop={handleStop}
                isLastQuestion={currentQuestionIndex === (session?.questions.length ?? 0) - 1}
                transcript={answerData?.transcript || (mode === 'voice' ? transcript : answerText)}
                audioBlob={answerData?.transcript ? audioBlob : null}
            />

            <EngagementDebugOverlay
                isVisible={showDebug}
                onClose={() => setShowDebug(false)}
                tracker={{
                    totalEngagedSeconds: session?.engagedTimeSeconds || 0,
                    isWindowOpen: isEngagementWindowOpen,
                    trackEvent,
                    debugEvents: engagementDebugEvents,
                    windowTimeRemaining: engagementWindowTimeRemaining,
                    clearDebugEvents: clearDebugEvents
                }}
            />

            <button
                onClick={() => setShowDebug(true)}
                className="fixed bottom-0 left-0 w-16 h-16 opacity-0 z-50 cursor-default"
                aria-hidden="true"
                title="Debug"
            />
        </div>
    );
}
