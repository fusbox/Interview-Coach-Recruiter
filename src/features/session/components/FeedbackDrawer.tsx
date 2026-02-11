import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AnalysisResult } from '@/lib/domain/types';
import { CheckCircle2, ChevronDown, ChevronRight, X, ArrowRight, CheckCircle } from 'lucide-react';

interface FeedbackDrawerProps {
    isOpen: boolean;
    analysis?: AnalysisResult;
    isThinking?: boolean;
    onNext: () => void;
    onRetry: () => void;
    onClose?: () => void; // Optional if we want to dismiss without action
    onStop?: () => void; // Explicit "Stop for now" action
    isLastQuestion?: boolean;
}

export function FeedbackDrawer({
    isOpen,
    analysis,
    isThinking = false,
    onNext,
    onRetry,
    onClose,
    onStop,
    isLastQuestion = false
}: FeedbackDrawerProps) {
    const [whyOpen, setWhyOpen] = useState(false);

    // Helper: Label Mapping
    const getDimensionLabel = (dim: string) => {
        const map: Record<string, string> = {
            'specificity_concreteness': 'Specific & Concrete',
            'outcome_explicitness': 'Outcome Clarity',
            'structural_clarity': 'Structure',
            'decision_rationale': 'Decision Logic',
            'focus_relevance': 'Focus',
            'delivery_control': 'Delivery'
        };
        return map[dim] || dim.replace(/_/g, " ");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-40 md:hidden"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute bottom-0 inset-x-0 mx-auto z-50 bg-white rounded-t-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh] w-full max-w-3xl border-x border-t border-slate-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="font-semibold text-slate-800">Feedback</h2>
                            {onClose && (
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X size={20} className="text-slate-500" />
                                </button>
                            )}
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {isThinking || !analysis ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                        <span className="text-sm text-slate-500 font-medium">Analyzing your answer...</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
                                    <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
                                    <div className="h-20 bg-slate-50 rounded animate-pulse" />
                                </div>
                            ) : (
                                <>
                                    {/* Ack Text */}
                                    <div className="text-slate-600 font-medium text-lg leading-relaxed">
                                        {analysis.ack}
                                    </div>

                                    {/* Primary Focus Block */}
                                    <div className="bg-white border-l-4 border-blue-500 shadow-sm rounded-r-lg p-5 space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-blue-50 text-blue-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide">
                                                {analysis.primaryFocus?.dimension ? getDimensionLabel(analysis.primaryFocus.dimension) : 'Feedback'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                            {analysis.primaryFocus?.headline}
                                        </h3>
                                        <p className="text-slate-700 text-sm leading-relaxed">
                                            {analysis.primaryFocus?.body}
                                        </p>
                                    </div>

                                    {/* Suggestion - Why this helps */}
                                    {analysis.whyThisMatters && (
                                        <div className="border rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => setWhyOpen(!whyOpen)}
                                                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                                            >
                                                <span className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    Why this matters
                                                </span>
                                                {whyOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </button>
                                            <AnimatePresence>
                                                {whyOpen && (
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: "auto" }}
                                                        exit={{ height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-3 text-sm text-slate-600 border-t bg-white">
                                                            {analysis.whyThisMatters}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* Suggested Action */}
                                    {analysis.nextAction && (
                                        <div className="bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Try This</p>
                                            <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                                <ArrowRight className="w-4 h-4 text-blue-500" />
                                                {analysis.nextAction.label}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t bg-slate-50 flex flex-col gap-3">
                            {/* Primary Action: Let Me Try */}
                            <Button
                                size="lg"
                                className="w-full bg-blue-600 hover:bg-blue-700 shadow-md font-semibold text-lg py-6"
                                onClick={onRetry}
                                disabled={isThinking}
                            >
                                Let Me Try
                            </Button>

                            {/* Separator - Subtle */}
                            <div className="h-px bg-slate-200 w-full my-1" />

                            {/* Secondary Action: Advance */}
                            <Button
                                variant="outline"
                                className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                onClick={onNext}
                                disabled={isThinking}
                            >
                                {isLastQuestion ? (
                                    <>Finish Session <CheckCircle className="ml-2 w-4 h-4" /></>
                                ) : (
                                    <>Skip to Next Question <ArrowRight className="ml-2 w-4 h-4" /></>
                                )}
                            </Button>

                            {/* Ghost Action: Stop (Only if not last question) */}
                            {!isLastQuestion && (onStop || onClose) && (
                                <button
                                    onClick={onStop || onClose}
                                    className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors py-2"
                                >
                                    Stop for now
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
