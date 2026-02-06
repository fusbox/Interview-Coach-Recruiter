"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, ChevronRight, ChevronLeft, Check, Plus, Trash2, Loader2 } from "lucide-react";

// --- Types ---

interface Details {
    role: string;
    jd: string;
    firstName: string;
    lastName: string;
    candidateEmail: string;
    reqId: string;
}

interface QuestionInput {
    id: string; // temp id for UI key
    text: string;
    category: string;
    label: string; // Display label (e.g. "Situation")
    isLocked?: boolean; // If structural (STAR/PERMA)
}

// --- Defaults ---

const STAR_TEMPLATE: QuestionInput[] = [
    { id: 's', text: '', category: 'STAR', label: 'Situation', isLocked: true },
    { id: 't', text: '', category: 'STAR', label: 'Task', isLocked: true },
    { id: 'a', text: '', category: 'STAR', label: 'Action', isLocked: true },
    { id: 'r', text: '', category: 'STAR', label: 'Result', isLocked: true },
];

const PERMA_TEMPLATE: QuestionInput[] = [
    { id: 'p', text: '', category: 'PERMA', label: 'Positive Emotion', isLocked: true },
    { id: 'e', text: '', category: 'PERMA', label: 'Engagement', isLocked: true },
    { id: 'rel', text: '', category: 'PERMA', label: 'Relationships', isLocked: true },
    { id: 'm', text: '', category: 'PERMA', label: 'Meaning', isLocked: true },
    { id: 'acc', text: '', category: 'PERMA', label: 'Accomplishment', isLocked: true },
];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            size="icon"
            variant="outline"
            onClick={handleCopy}
            className={`transition-all duration-300 transform ${copied
                ? 'bg-green-100 border-green-500 text-green-700 scale-110 shadow-md rotate-3'
                : 'bg-white border-input hover:bg-slate-100 hover:text-slate-900 active:scale-95'
                }`}
        >
            {copied ? (
                <Check className="w-5 h-5 animate-in zoom-in spin-in-45 duration-300" />
            ) : (
                <Copy className="w-4 h-4 transition-transform duration-300 hover:scale-110" />
            )}
        </Button>
    );
}

export default function CreateInviteWizard() {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [details, setDetails] = useState<Details>({
        role: "", jd: "", firstName: "", lastName: "", candidateEmail: "", reqId: ""
    });

    // Questions State
    const [star, setStar] = useState<QuestionInput[]>(STAR_TEMPLATE);
    const [perma, setPerma] = useState<QuestionInput[]>(PERMA_TEMPLATE);
    const [technical, setTechnical] = useState<QuestionInput[]>([{ id: 'tech-1', text: '', category: 'Technical', label: 'Technical Q1' }]);
    const [other, setOther] = useState<QuestionInput[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    // --- Actions ---

    const addTechnical = () => {
        setTechnical([...technical, {
            id: `tech-${Date.now()}`,
            text: '',
            category: 'Technical',
            label: `Technical Q${technical.length + 1}`
        }]);
    };

    const addOther = () => {
        setOther([...other, {
            id: `other-${Date.now()}`,
            text: '',
            category: 'Other',
            label: `Other Q${other.length + 1}`
        }]);
    };

    const removeQuestion = (set: Function, list: QuestionInput[], id: string) => {
        set(list.filter(q => q.id !== id));
    };

    const updateQuestion = (set: Function, list: QuestionInput[], id: string, text: string) => {
        set(list.map(q => q.id === id ? { ...q, text } : q));
    };

    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Flatten questions
            const allQuestions = [
                ...star,
                ...perma,
                ...technical,
                ...other
            ].filter(q => q.text.trim().length > 0)
                .map((q, idx) => ({
                    text: q.text,
                    category: q.category,
                    index: idx
                }));

            if (allQuestions.length === 0) {
                setError("Please add at least one question.");
                setIsLoading(false);
                return;
            }

            const payload = {
                role: details.role,
                jobDescription: details.jd,
                candidate: {
                    firstName: details.firstName,
                    lastName: details.lastName,
                    email: details.candidateEmail,
                    reqId: details.reqId
                },
                questions: allQuestions
            };

            const res = await fetch("/api/recruiter/invites", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create invite");
            }

            if (data.link) {
                const url = `${window.location.origin}${data.link}`;
                setInviteLink(url);
                setStep(4);
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to create invite");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Steps ---

    const StepFooter = ({ onBack, onNext, nextLabel, isNextDisabled }: { onBack?: () => void, onNext: () => void, nextLabel: string | React.ReactNode, isNextDisabled?: boolean }) => (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t md:static md:bg-transparent md:border-0 md:p-0 md:mt-6 z-20">
            <div className="flex justify-between items-center max-w-3xl mx-auto w-full">
                <div>
                    {onBack && (
                        <Button variant="outline" onClick={onBack}>
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    )}
                </div>
                <Button onClick={onNext} disabled={isNextDisabled}>
                    {nextLabel}
                </Button>
            </div>
        </div>
    );

    const renderDetails = () => (
        <div className="space-y-6 pb-20 md:pb-0">
            <div>
                <h2 className="text-2xl font-bold">Step 1: Role & Candidate</h2>
                <p className="text-muted-foreground">Enter the details for this interview session.</p>
            </div>

            <Card>
                <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">First Name</label>
                            <input className="flex h-10 w-full rounded-md border border-input px-3"
                                value={details.firstName} onChange={e => setDetails({ ...details, firstName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Last Name</label>
                            <input className="flex h-10 w-full rounded-md border border-input px-3"
                                value={details.lastName} onChange={e => setDetails({ ...details, lastName: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Candidate Email</label>
                            <input className="flex h-10 w-full rounded-md border border-input px-3" type="email"
                                value={details.candidateEmail} onChange={e => setDetails({ ...details, candidateEmail: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Req ID</label>
                            <input className="flex h-10 w-full rounded-md border border-input px-3"
                                value={details.reqId} onChange={e => setDetails({ ...details, reqId: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target Role</label>
                            <input className="flex h-10 w-full rounded-md border border-input px-3"
                                value={details.role} onChange={e => setDetails({ ...details, role: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Job Description (Optional)</label>
                        <textarea className="flex min-h-[100px] w-full rounded-md border border-input px-3 py-2"
                            value={details.jd} onChange={e => setDetails({ ...details, jd: e.target.value })} />
                    </div>
                </CardContent>
            </Card>

            <StepFooter
                onNext={() => setStep(2)}
                nextLabel={<>Next: Questions <ChevronRight className="ml-2 w-4 h-4" /></>}
                isNextDisabled={!details.role || !details.firstName || !details.lastName || !details.candidateEmail || !details.reqId}
            />
        </div>
    );

    const renderQuestions = () => (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Step 2: Configure Questions</h2>
            </div>

            {/* STAR Section */}
            <Card>
                <CardHeader><CardTitle>STAR Questions (Behavioral)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {star.map(q => (
                        <div key={q.id}>
                            <label className="text-xs font-semibold uppercase text-muted-foreground">{q.label}</label>
                            <input className="flex h-10 w-full rounded-md border border-input px-3"
                                value={q.text} onChange={e => updateQuestion(setStar, star, q.id, e.target.value)}
                                placeholder={`Enter ${q.label} question...`} />
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
                            <label className="text-xs font-semibold uppercase text-muted-foreground">{q.label}</label>
                            <input className="flex h-10 w-full rounded-md border border-input px-3"
                                value={q.text} onChange={e => updateQuestion(setPerma, perma, q.id, e.target.value)}
                                placeholder={`Enter ${q.label} question...`} />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Technical Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Technical Questions</CardTitle>
                    <Button size="sm" variant="outline" onClick={addTechnical}><Plus className="w-4 h-4 mr-1" /> Add</Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {technical.map((q, idx) => (
                        <div key={q.id} className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Technical Q{idx + 1}</label>
                                <input className="flex h-10 w-full rounded-md border border-input px-3"
                                    value={q.text} onChange={e => updateQuestion(setTechnical, technical, q.id, e.target.value)} />
                            </div>
                            {technical.length > 1 && (
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeQuestion(setTechnical, technical, q.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            <StepFooter
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                nextLabel="Next: Preview"
            />
        </div>
    );

    const renderPreview = () => (
        <div className="space-y-6 pb-20 md:pb-0">
            <div>
                <h2 className="text-2xl font-bold">Step 3: Preview & Confirm</h2>
                <p className="text-muted-foreground">Review the final question set before generating the invite.</p>
            </div>

            <Card>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                        <div><span className="font-semibold">Candidate:</span> {details.firstName} {details.lastName}</div>
                        <div><span className="font-semibold">Role:</span> {details.role}</div>
                        <div><span className="font-semibold">Email:</span> {details.candidateEmail}</div>
                        <div><span className="font-semibold">Req ID:</span> {details.reqId}</div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">Questions ({star.length + perma.length + technical.length + other.length})</h3>
                        <div className="bg-muted/50 p-4 rounded-md space-y-4 max-h-[400px] overflow-y-auto">
                            {[...star, ...perma, ...technical, ...other].filter(q => q.text.trim()).map((q, idx) => (
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
                onBack={() => setStep(2)}
                onNext={handleCreate}
                nextLabel={isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generate Invite</> : "Generate Invite"}
                isNextDisabled={isLoading}
            />
        </div>
    );

    const renderSuccess = () => (
        <Card className="bg-success/5 border-success/20">
            <CardHeader>
                <CardTitle className="text-success flex items-center gap-2">
                    <Check className="w-6 h-6" /> Invite Created!
                </CardTitle>
                <CardDescription>Send this link to the candidate.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <code className="flex-1 p-3 bg-white rounded border text-sm font-mono break-all">
                        {inviteLink}
                    </code>
                    <CopyButton text={inviteLink || ""} />
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline" onClick={() => {
                    setInviteLink(null);
                    setStep(1);
                    // Reset fields? 
                }}>Create Another</Button>
            </CardFooter>
        </Card >
    );

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8">
                {/* Simple Stepper */}
                <div className="relative">
                    <div className="absolute left-0 right-0 top-[15px] h-[2px] bg-muted/50 -z-10" />
                    <div className="grid grid-cols-4 w-full">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`flex flex-col items-center group cursor-pointer ${step >= s ? 'text-primary' : 'text-muted-foreground'}`}
                                onClick={() => s < step ? setStep(s as any) : null}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 transition-colors duration-200
                                     ${s < step ? 'border-accent bg-accent text-accent-foreground' :
                                        s === step ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.2)]' :
                                            'border-muted bg-background group-hover:border-primary/50'}`}>
                                    {s < step ? <Check className="w-4 h-4" /> : s}
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider">{s === 1 ? 'Details' : s === 2 ? 'Questions' : s === 3 ? 'Preview' : 'Done'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {step === 1 && renderDetails()}
            {step === 2 && renderQuestions()}
            {step === 3 && renderPreview()}
            {step === 4 && renderSuccess()}
        </div>
    );
}
