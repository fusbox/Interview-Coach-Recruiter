"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Details, QuestionInput, StepFooterProps } from "../constants";

interface StepPreviewProps {
    details: Details;
    star: QuestionInput[];
    perma: QuestionInput[];
    technical: QuestionInput[];
    other: QuestionInput[];
    error: string | null;
    isLoading: boolean;
    onBack: () => void;
    onHandleCreate: () => void;
    StepFooter: React.ComponentType<StepFooterProps>;
}

export function StepPreview({
    details, star, perma, technical, other,
    error, isLoading,
    onBack, onHandleCreate,
    StepFooter
}: StepPreviewProps) {
    const allQuestions = [...star, ...perma, ...technical, ...other].filter(q => q.text.trim());

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Step 3: Preview & Confirm</h2>
                <p className="text-muted-foreground">Review the final question set before generating the invite.</p>
            </div>

            <Card>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-b pb-4">
                        <div><span className="font-semibold">Candidate:</span> {details.firstName} {details.lastName}</div>
                        <div><span className="font-semibold">Email:</span> {details.candidateEmail}</div>
                        <div><span className="font-semibold">Req ID:</span> {details.reqId}</div>
                        <div><span className="font-semibold">Role:</span> {details.role}</div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">Questions ({allQuestions.length})</h3>
                        <div className="bg-muted/50 p-4 rounded-md space-y-4 max-h-[400px] overflow-y-auto">
                            {allQuestions.map((q, idx) => (
                                <div key={q.id} className="flex gap-3">
                                    <Badge variant="outline" className="h-6 w-8 justify-center shrink-0">{idx + 1}</Badge>
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">{q.category} - {q.label}</div>
                                        <p className="text-sm">{q.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    {error && <div className="text-sm text-destructive font-medium">{error}</div>}
                </CardFooter>
            </Card>

            <StepFooter
                onBack={onBack}
                onNext={onHandleCreate}
                nextLabel={isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generate Invite</> : "Generate Invite"}
                isNextDisabled={isLoading}
            />
        </div>
    );
}
