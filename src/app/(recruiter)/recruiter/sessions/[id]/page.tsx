
import { SupabaseSessionRepository } from "@/lib/server/infrastructure/supabase-session-repository";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCachedUser } from "@/lib/supabase/server";
import { InterviewSession } from "@/lib/domain/types";

const sessionRepo = new SupabaseSessionRepository();

export const dynamic = 'force-dynamic';

function getReadinessIndicator(session: InterviewSession) {
    if (!session.answers || Object.keys(session.answers).length === 0) {
        return <Badge variant="outline" className="text-gray-500">Not Started</Badge>;
    }

    // Convert answers object to array
    const answers = Object.values(session.answers);
    const answerCount = answers.length;
    const questionCount = session.questions.length;

    if (answerCount < questionCount) {
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress ({answerCount}/{questionCount})</Badge>;
    }

    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Completed</Badge>;
}

export default async function SessionDetailsPage({ params }: { params: { id: string } }) {
    const user = await getCachedUser();
    if (!user) redirect("/login");

    const session = await sessionRepo.get(params.id);

    if (!session) {
        notFound();
    }

    // Verify Ownership
    if (session.recruiterId !== user.id) {
        // If the session exists but doesn't belong to this recruiter, return 404
        // to prevent leaking existence of sessions.
        notFound();
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/recruiter">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Session Details</h1>
                    <p className="text-slate-500">Review candidate performance and feedback.</p>
                </div>
            </div>

            {/* Summary Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Candidate Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm font-medium text-slate-500 mb-1">Candidate</div>
                            <div className="text-lg font-semibold text-slate-900">{session.candidateName || "Anonymous"}</div>
                            <div className="text-sm text-slate-500">{session.candidate?.email || "No email provided"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-500 mb-1">Target Role</div>
                            <div className="text-lg font-semibold text-slate-900">{session.role}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-500 mb-1">Status</div>
                            <div className="flex items-center gap-2 mt-1">
                                {getReadinessIndicator(session)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Questions & Answers */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Question Analysis</h2>

                {session.questions.map((question, index) => {
                    const answer = session.answers[question.id];
                    const hasAnswer = !!answer;
                    const hasAnalysis = !!answer?.analysis;

                    // Safe access for analysis properties
                    const analysis = answer?.analysis;
                    const primaryFocus = analysis?.primaryFocus;
                    const observations = analysis?.observations || [];

                    return (
                        <Card key={question.id} className="overflow-hidden border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Question {index + 1}
                                        </span>
                                        <h3 className="text-base font-medium text-slate-900 leading-snug">
                                            {question.text}
                                        </h3>
                                    </div>
                                    <div className="shrink-0">
                                        {hasAnswer ? (
                                            hasAnalysis ?
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Analyzed</Badge> :
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Submitted</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-400 border-slate-200">Pending</Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {hasAnswer && (
                                <CardContent className="p-6 space-y-6">
                                    {/* Transcript */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-slate-900">Candidate Response</h4>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 text-sm leading-relaxed">
                                            {answer.transcript ? (
                                                <p className="whitespace-pre-wrap">{answer.transcript}</p>
                                            ) : (
                                                <span className="italic text-slate-400">No transcript available.</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Analysis Grid */}
                                    {hasAnalysis && analysis && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                            {/* Left: Primary Focus */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                                                    Primary Coaching Focus
                                                </h4>
                                                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100/50 h-full">
                                                    <p className="font-medium text-blue-900 mb-2">
                                                        {primaryFocus?.headline || "Focus Area"}
                                                    </p>
                                                    <p className="text-sm text-blue-800/90 leading-relaxed">
                                                        {primaryFocus?.body || "No detailed feedback available."}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right: Observations */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-slate-900">Key Observations</h4>
                                                <div className="pl-4">
                                                    <ul className="list-disc text-sm text-slate-600 space-y-2 marker:text-slate-400">
                                                        {observations.length > 0 ? (
                                                            observations.map((obs, i) => (
                                                                <li key={i}>{obs}</li>
                                                            ))
                                                        ) : (
                                                            <li className="italic text-slate-400">No observations recorded.</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            )}

                            {!hasAnswer && (
                                <CardContent className="p-8 text-center text-slate-400 italic text-sm">
                                    The candidate has not answered this question yet.
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
