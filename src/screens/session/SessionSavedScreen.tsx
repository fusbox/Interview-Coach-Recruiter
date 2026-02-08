"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";

export default function SessionSavedScreen() {
    const { updateSession, session } = useSession();

    const handleResume = async () => {
        if (!session) return;
        // Resume to IN_SESSION or REVIEWING? 
        // Logic: If last action was "Stop" from Feedback, we were in REVIEWING.
        // But maybe we want to go back to Question?
        // Let's assume we go back to IN_SESSION for the next question or current?
        // Actually, if we stopped during Feedback, we might want to return to Feedback or Next Question.
        // User spec: "Resume Session" -> Returns to previous context?
        // "Stop for now" was clicked in Feedback screen.
        // So we should probably return to IN_SESSION (next question) or REVIEWING (current feedback)?
        // Let's try to restore to IN_SESSION (safe default) or whatever logic suits.
        // Better: We can store `lastStatus` in metadata, but for V1 let's resume to `IN_SESSION` for the *next* logical step or just stay on current?
        // If we "Stop", we likely stay on current index.
        // If we resume, we should probably go to `IN_SESSION` for current index (if unanswered) or `REVIEWING` (if answered)?

        // Simpler: Just set status to 'IN_SESSION' and let Orchestrator routing handle it.
        // If current index has answer + analysis, logic might auto-route to REVIEWING?
        // SessionOrchestrator logic: 
        // if status === 'IN_SESSION' -> Input Screen.
        // if status === 'REVIEWING' -> Feedback Screen.

        // If we stopped from Feedback, we were in REVEIWING.
        // If we resume to REVIEWING, user sees feedback again.
        // If we resume to IN_SESSION, user sees Input screen for *current* question? 
        // But current question is Answered. 
        // New Orchestrator logic will show "Revisit Mode".
        // This seems safe.
        await updateSession(session.id, { status: 'IN_SESSION' });
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-3xl">
                    💾
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-800">Session Saved</h1>
                    <p className="text-slate-500">
                        Your progress is safe. You can resume this session anytime.
                    </p>
                </div>

                <div className="pt-4">
                    <Button
                        size="lg"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/10"
                        onClick={handleResume}
                    >
                        Resume Session
                    </Button>
                </div>
            </div>
        </div>
    );
}
