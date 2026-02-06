import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Question, AnalysisResult } from "@/lib/domain/types"
import { ArrowRight, CheckCircle2, Lightbulb, RotateCcw, Save } from "lucide-react"

interface ReviewFeedbackScreenProps {
    question: Question;
    analysis?: AnalysisResult;
    onNext: () => void;
    onRetry: () => void;
}

export default function ReviewFeedbackScreen({ question, analysis, onNext, onRetry }: ReviewFeedbackScreenProps) {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (!analysis) {
        return <div className="p-8 text-center text-muted-foreground">Loading feedback...</div>;
    }

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Header */}
            <header className="px-6 py-4 bg-card border-b sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <h1 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Feedback Review
                    </h1>
                    <div className="flex gap-2">
                        {/* Mobile Header Actions? Maybe keep it clean */}
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-6 space-y-6">

                {/* Question Context */}
                <Card>
                    <CardHeader>
                        <CardDescription className="uppercase font-bold text-xs tracking-widest">
                            The Question
                        </CardDescription>
                        <CardTitle className="text-xl font-medium tracking-tight">
                            {question.text}
                        </CardTitle>
                    </CardHeader>
                </Card>

                {/* Coach Reaction & Band */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    Coach's Take
                                </CardTitle>
                                <CardDescription className="text-base text-foreground/90 font-medium">
                                    {analysis.coachReaction}
                                </CardDescription>
                            </div>

                            {/* Readiness Badge */}
                            <div className="flex flex-col items-end gap-1">
                                {analysis.readinessBand === 'RL4' && <Badge className="bg-primary hover:bg-primary/90">Role Model</Badge>}
                                {analysis.readinessBand === 'RL3' && <Badge className="bg-success hover:bg-success/90">Ready</Badge>}
                                {analysis.readinessBand === 'RL2' && <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">Potential</Badge>}
                                {analysis.readinessBand === 'RL1' && <Badge className="bg-destructive hover:bg-destructive/90">Not Ready</Badge>}
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Readiness</span>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Feedback Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Strengths */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-success">
                                <CheckCircle2 className="w-5 h-5" />
                                Highlights
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {(analysis.strengths || []).map((point, i) => (
                                    <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                                        • {point}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Opportunities */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-warning">
                                <Lightbulb className="w-5 h-5" />
                                Opportunities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {(analysis.opportunities || []).map((point, i) => (
                                    <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                                        • {point}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Persistent Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-20 shadow-lg">
                <div className="max-w-3xl mx-auto flex justify-between items-center">

                    <Button variant="outline" onClick={onRetry} className="gap-2">
                        <RotateCcw className="w-4 h-4" /> Retry Response
                    </Button>

                    <div className="flex gap-4 items-center">
                        <Button
                            variant="ghost"
                            onClick={handleSave}
                            className={`gap-2 ${saved ? "text-green-600" : "text-muted-foreground"}`}
                        >
                            <Save className="w-4 h-4" /> {saved ? "Progress Saved" : "Save Progress"}
                        </Button>

                        <Button onClick={onNext} size="lg" className="px-8 gap-2">
                            Continue <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
