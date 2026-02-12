"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { QuestionInput, StepFooterProps } from "../constants";

interface StepQuestionsProps {
    star: QuestionInput[];
    setStar: (val: QuestionInput[]) => void;
    perma: QuestionInput[];
    setPerma: (val: QuestionInput[]) => void;
    technical: QuestionInput[];
    setTechnical: (val: QuestionInput[]) => void;
    onBack: () => void;
    onNext: () => void;
    onPopulateDebug?: () => void;
    StepFooter: React.ComponentType<StepFooterProps>;
}

export function StepQuestions({
    star, setStar,
    perma, setPerma,
    technical, setTechnical,
    onBack, onNext,
    onPopulateDebug,
    StepFooter
}: StepQuestionsProps) {
    const addTechnical = () => {
        setTechnical([...technical, {
            id: `tech-${Date.now()}`,
            text: '',
            category: 'Technical',
            label: `Technical Q${technical.length + 1}`
        }]);
    };

    const removeQuestion = (set: (val: QuestionInput[]) => void, list: QuestionInput[], id: string) => {
        set(list.filter(q => q.id !== id));
    };

    const updateQuestion = (set: (val: QuestionInput[]) => void, list: QuestionInput[], id: string, text: string) => {
        set(list.map(q => q.id === id ? { ...q, text } : q));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Step 2: Configure Questions</h2>
                {onPopulateDebug && (
                    <button
                        onClick={onPopulateDebug}
                        className="w-4 h-4 bg-red-500/10 hover:bg-red-500 transition-colors rounded-full cursor-pointer"
                        title="Debug: Populate Questions"
                    />
                )}
            </div>

            {/* STAR Section */}
            <Card>
                <CardHeader><CardTitle>STAR Questions (Behavioral)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {star.map(q => (
                        <div key={q.id}>
                            <input className="flex h-10 w-full rounded-md border bg-muted/50 px-3 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                                value={q.text} onChange={e => updateQuestion(setStar, star, q.id, e.target.value)}
                                placeholder={`${q.label} Question...`} />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* PERMA Section */}
            <Card>
                <CardHeader><CardTitle>PERMA Questions (Culture/Fit)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {perma.map(q => (
                        <div key={q.id}>
                            <input className="flex h-10 w-full rounded-md border bg-muted/50 px-3 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                                value={q.text} onChange={e => updateQuestion(setPerma, perma, q.id, e.target.value)}
                                placeholder={`${q.label} Question...`} />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Technical Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Technical Questions</CardTitle>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={addTechnical}
                        className="hidden sm:flex text-emerald-600 border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {technical.map((q, idx) => (
                        <div key={q.id} className="flex gap-2 items-center">
                            <div className="flex-1">
                                <input className="flex h-10 w-full rounded-md border bg-muted/50 px-3 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                                    value={q.text} onChange={e => updateQuestion(setTechnical, technical, q.id, e.target.value)}
                                    placeholder={`Technical Question ${idx + 1}...`} />
                            </div>
                            {technical.length > 1 && (
                                <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => removeQuestion(setTechnical, technical, q.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        onClick={addTechnical}
                        className="w-full sm:hidden border-dashed text-emerald-600 border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 mt-2"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Technical Question
                    </Button>
                </CardContent>
            </Card>

            <StepFooter
                onBack={onBack}
                onNext={onNext}
                nextLabel="Next: Preview"
            />
        </div>
    );
}
