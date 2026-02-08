"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, ChevronRight, ChevronLeft, Check, Plus, Trash2, Loader2, Send } from "lucide-react";

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
                : 'bg-white bg-muted/50 hover:bg-slate-100 hover:text-slate-900 active:scale-95'
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

    // --- Step 4: Email Template State ---

    const [recruiterProfile, setRecruiterProfile] = useState({
        name: "",
        title: "", // Not yet in DB? We only have first/last/phone. Title is hardcoded for now or we add to DB later.
        company: "Rangam Consultants Inc.",
        phone: "",
        email: "",
        logoUrl: "/rangam-logo-placeholder.png"
    });

    const [emailDraft, setEmailDraft] = useState({
        toFirstName: "",
        toLastName: "",
        toEmail: "",
        cc: "",
        subject: "Interview Invitation: Product Manager Role",
        bodyMessage: "Hi,\n\nI'd like to invite you to a preliminary interview practice session. Please click the link below to get started."
    });

    // Fetch Recruiter Profile
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('recruiter_profiles')
                    .select('*')
                    .eq('recruiter_id', user.id)
                    .single();

                const name = data ? `${data.first_name} ${data.last_name || ''}`.trim() : "Recruiter";
                const phone = data?.phone || "";

                setRecruiterProfile(prev => ({
                    ...prev,
                    name: name || "Recruiter",
                    email: user.email || "",
                    phone: phone
                }));

                // Update CC to recruiter email
                setEmailDraft(prev => ({ ...prev, cc: user.email || "" }));
            }
        };
        fetchProfile();
    }, []);

    // Populate draft on entry to step 4
    const initializeEmailDraft = () => {
        setEmailDraft(prev => ({
            ...prev,
            toFirstName: details.firstName,
            toLastName: details.lastName,
            toEmail: details.candidateEmail,
            subject: `Interview Invitation: ${details.role}`,
            bodyMessage: `Hi ${details.firstName},\n\nI'd like to invite you to a preliminary interview practice session for the ${details.role} role. This interactive session will help us understand your experience better.\n\nPlease click the button below to start whenever you're ready.`
        }));
    };

    // Row Edit States
    const [editingField, setEditingField] = useState<string | null>(null);

    const toggleEdit = (field: string) => {
        if (editingField === field) {
            setEditingField(null); // Save
        } else {
            setEditingField(field); // Edit
        }
    };

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
                initializeEmailDraft(); // Init draft with details
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
        <div className="mt-6">
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

    // --- Debug / Test Data ---
    const populateDetails = () => {
        setDetails({
            firstName: "Ian",
            lastName: "Caldwell",
            candidateEmail: "ICClearly@yopmail.com",
            reqId: "RCI-QD-18250-1",
            role: "Phlebotomist II",
            jd: details.jd
        });
    };

    const populateQuestions = () => {
        const newStar = [...STAR_TEMPLATE];
        newStar[0].text = "Can you describe a time when you had to draw blood from a nervous patient? How did you handle the situation?";
        newStar[1].text = "Describe a time when you were responsible for ensuring specimens were collected correctly. What steps did you take?";
        newStar[2].text = "What actions did you take to improve the blood draw process in your previous role?";
        newStar[3].text = "What was the outcome of a time when you successfully resolved a conflict with a patient during a blood draw?";
        setStar(newStar);

        const newPerma = [...PERMA_TEMPLATE];
        newPerma[0].text = "How do you maintain a positive attitude when facing stressful situations at work?";
        newPerma[1].text = "How do you stay engaged and motivated during repetitive tasks like blood draws?";
        newPerma[2].text = "How do you build rapport with patients quickly?";
        newPerma[3].text = "What does your work as a phlebotomist mean to you personally?";
        newPerma[4].text = "What is a significant accomplishment you achieved in your previous position?";
        setPerma(newPerma);

        setTechnical([
            { id: 'tech-1', text: "What techniques do you use to draw blood from pediatric patients?", category: 'Technical', label: 'Technical Q1' }
        ]);
    };

    const renderDetails = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Step 1: Role & Candidate</h2>
                    <p className="text-muted-foreground">Enter the details for this interview session.</p>
                </div>
                {/* Hidden Debug Button - Top Right Corner */}
                <button
                    onClick={populateDetails}
                    className="w-4 h-4 bg-red-500/10 hover:bg-red-500 transition-colors rounded-full cursor-pointer"
                    title="Debug: Populate Ian's Data"
                />
            </div>

            <Card>
                <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <input className="flex h-10 w-full rounded-md border bg-muted/50 px-3 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                                value={details.firstName} onChange={e => setDetails({ ...details, firstName: e.target.value })}
                                placeholder="First Name" />
                        </div>
                        <div className="space-y-2">
                            <input className="flex h-10 w-full rounded-md border bg-muted/50 px-3 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                                value={details.lastName} onChange={e => setDetails({ ...details, lastName: e.target.value })}
                                placeholder="Last Name" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <input className="flex h-10 w-full rounded-md border bg-muted/50 px-3 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400" type="email"
                                value={details.candidateEmail} onChange={e => setDetails({ ...details, candidateEmail: e.target.value })}
                                placeholder="Candidate Email" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <input className="flex h-10 w-full rounded-md border bg-muted/50 px-3 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                                value={details.reqId} onChange={e => setDetails({ ...details, reqId: e.target.value })}
                                placeholder="Req ID" />
                        </div>
                        <div className="space-y-2">
                            <input className="flex h-10 w-full rounded-md border bg-muted/50 px-3 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                                value={details.role} onChange={e => setDetails({ ...details, role: e.target.value })}
                                placeholder="Target Role" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <textarea className="flex min-h-[100px] w-full rounded-md border bg-muted/50 px-3 py-2 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                            value={details.jd} onChange={e => setDetails({ ...details, jd: e.target.value })}
                            placeholder="Job Description (Optional)" />
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Step 2: Configure Questions</h2>
                {/* Hidden Debug Button - Top Right Corner */}
                <button
                    onClick={populateQuestions}
                    className="w-4 h-4 bg-red-500/10 hover:bg-red-500 transition-colors rounded-full cursor-pointer"
                    title="Debug: Populate Questions"
                />
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
                    {/* Mobile Only Add Button */}
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
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                nextLabel="Next: Preview"
            />
        </div>
    );

    const renderPreview = () => (
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

    const resetWizard = () => {
        setStep(1);
        setDetails({ role: "", jd: "", firstName: "", lastName: "", candidateEmail: "", reqId: "" });
        setStar(STAR_TEMPLATE);
        setPerma(PERMA_TEMPLATE);
        setTechnical([{ id: 'tech-1', text: '', category: 'Technical', label: 'Technical Q1' }]);
        setOther([]);
        setInviteLink(null);
        setError(null);
    };

    const renderEmailTemplate = () => (
        <div className="space-y-6 font-sans">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Step 4: Send Invitation</h2>
                    <p className="text-muted-foreground">Review and customize the invite email.</p>
                </div>
            </div>

            <Card className="overflow-hidden border-t-4 border-t-primary shadow-md">
                <CardContent className="p-0 text-sm">

                    {/* Row 1: Candidate Name (Read-only + Edit) */}
                    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-4 p-4 border-b hover:bg-slate-50/50 transition-colors">
                        <span className="font-semibold text-muted-foreground">Name:</span>
                        <div className="flex flex-col md:flex-row gap-2 w-full">
                            {editingField === 'name' ? (
                                <>
                                    <input
                                        className="border rounded px-2 py-1 flex-1 max-w-[150px]"
                                        value={emailDraft.toFirstName}
                                        onChange={e => setEmailDraft({ ...emailDraft, toFirstName: e.target.value })}
                                        placeholder="First"
                                    />
                                    <input
                                        className="border rounded px-2 py-1 flex-1 max-w-[150px]"
                                        value={emailDraft.toLastName}
                                        onChange={e => setEmailDraft({ ...emailDraft, toLastName: e.target.value })}
                                        placeholder="Last"
                                    />
                                </>
                            ) : (
                                <span className="font-medium text-slate-900">{emailDraft.toFirstName} {emailDraft.toLastName}</span>
                            )}
                        </div>
                        <Button
                            key={editingField === 'name' ? 'save-name' : 'edit-name'}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onMouseDown={(e) => { e.preventDefault(); toggleEdit('name'); }}
                            className="text-primary h-8 hover:bg-transparent hover:text-primary active:scale-95 transition-all"
                        >
                            {editingField === 'name' ? "Save" : "Edit"}
                        </Button>
                    </div>

                    {/* Row 2: From (Read-only) */}
                    <div className="grid grid-cols-[80px_1fr] items-center gap-4 p-4 border-b bg-slate-50/30">
                        <span className="font-semibold text-muted-foreground">From:</span>
                        <span className="text-slate-700">{recruiterProfile.email}</span>
                    </div>

                    {/* Row 3: To (Read-only + Edit) */}
                    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-4 p-4 border-b hover:bg-slate-50/50 transition-colors">
                        <span className="font-semibold text-muted-foreground">To:</span>
                        <div>
                            {editingField === 'to' ? (
                                <input
                                    className="border rounded px-2 py-1 w-full max-w-md"
                                    value={emailDraft.toEmail}
                                    onChange={e => setEmailDraft({ ...emailDraft, toEmail: e.target.value })}
                                />
                            ) : (
                                <span className="text-slate-900">{emailDraft.toEmail}</span>
                            )}
                        </div>
                        <Button
                            key={editingField === 'to' ? 'save-to' : 'edit-to'}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onMouseDown={(e) => { e.preventDefault(); toggleEdit('to'); }}
                            className="text-primary h-8 hover:bg-transparent hover:text-primary active:scale-95 transition-all"
                        >
                            {editingField === 'to' ? "Save" : "Edit"}
                        </Button>
                    </div>

                    {/* Row 4: Cc (Editable) */}
                    <div className="grid grid-cols-[80px_1fr] items-center gap-4 p-4 border-b hover:bg-slate-50/50 transition-colors">
                        <span className="font-semibold text-muted-foreground">Cc:</span>
                        <input
                            className="border-none bg-transparent w-full focus:ring-0 px-0 placeholder:text-muted-foreground/50"
                            value={emailDraft.cc}
                            onChange={e => setEmailDraft({ ...emailDraft, cc: e.target.value })}
                            placeholder="Add Cc..."
                        />
                    </div>

                    {/* Row 5: Subject (Editable) */}
                    <div className="grid grid-cols-[80px_1fr] items-center gap-4 p-4 border-b hover:bg-slate-50/50 transition-colors">
                        <span className="font-semibold text-muted-foreground">Subject:</span>
                        <input
                            className="font-medium border-none bg-transparent w-full focus:ring-0 px-0"
                            value={emailDraft.subject}
                            onChange={e => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                        />
                    </div>

                    {/* Row 6: Body (Editable Template) */}
                    <div className="p-6 bg-white min-h-[400px] flex flex-col gap-6">

                        {/* Editable Message Body */}
                        <textarea
                            className="w-full min-h-[150px] resize-none border-none focus:ring-0 p-0 text-base leading-relaxed text-slate-800"
                            value={emailDraft.bodyMessage}
                            onChange={e => setEmailDraft({ ...emailDraft, bodyMessage: e.target.value })}
                        />

                        {/* Invite Button (Visual) */}
                        <div className="py-2">
                            <a
                                href={inviteLink || "#"}
                                target="_blank"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                onClick={(e) => e.preventDefault()} // Don't actually navigate in builder
                            >
                                Start Interview Session
                            </a>
                            <div className="text-xs text-muted-foreground mt-2 font-mono bg-slate-50 p-1 rounded inline-block break-all whitespace-normal max-w-full">
                                Link: {inviteLink}
                            </div>
                        </div>

                        {/* Signature (Partially Editable via Profile mockup?) - Read Only for now per spec "Pre-filled" */}
                        <div className="text-slate-600 space-y-1 pt-4 border-t mt-auto">
                            <div>Best regards,</div>
                            <br />
                            <div className="font-bold text-slate-800">{recruiterProfile.name}</div>
                            <div>{recruiterProfile.title}</div>
                            <div className="font-semibold text-primary">{recruiterProfile.company}</div>
                            {/* Logo */}
                            <div className="py-2">
                                {/* User provided logo */}
                                <img
                                    src="/rangam-logo.webp"
                                    alt="Rangam"
                                    className="h-12 w-auto object-contain"
                                />
                            </div>
                            <div className="text-xs">
                                <div>M: {recruiterProfile.phone}</div>
                                <div>E: {recruiterProfile.email}</div>
                            </div>
                        </div>

                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                <Button
                    className="flex-[2] gap-2"
                    onClick={() => {
                        window.location.href = `mailto:${emailDraft.toEmail}?cc=${emailDraft.cc}&subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.bodyMessage + `\n\nLink: ${inviteLink}\n\nBest regards,\n${recruiterProfile.name}`)}`;
                    }}
                >
                    <Send className="w-4 h-4" /> Open in Email Client
                </Button>
            </div>
            <Button variant="outline" onClick={resetWizard} className="w-full mt-4">
                <Plus className="w-4 h-4 mr-2" /> Create Another
            </Button>
            <p className="text-xs text-center text-muted-foreground">
                Note: In a real integration, this would send via SendGrid/AWS SES. For now, it opens your default mail app.
            </p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto pb-8 pt-24 md:py-8">
            {/* Simple Stepper Container */}
            {/* Sticky Mobile Header for Stepper */}
            <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 py-3 border-b md:static md:bg-transparent md:border-none md:p-0 md:m-0 md:mb-8 transition-all">
                <div className="relative">
                    <div className="absolute left-0 right-0 top-[15px] h-[2px] bg-muted/50 -z-10" />
                    <div className="flex w-full">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`flex-1 flex flex-col items-center group cursor-pointer ${s < step ? 'text-emerald-600' : (s === step ? 'text-primary' : 'text-muted-foreground')}`}
                                onClick={() => s < step ? setStep(s as any) : null}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 transition-colors duration-200
                                     ${s < step ? 'border-emerald-600 bg-slate-50 text-emerald-600' :
                                        s === step ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.2)]' :
                                            'border-muted bg-background group-hover:border-primary/50'}`}>
                                    {s < step ? <Check className="w-4 h-4" /> : s}
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider">{s === 1 ? 'Details' : s === 2 ? 'Questions' : s === 3 ? 'Preview' : 'Send'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {step === 1 && renderDetails()}
            {step === 2 && renderQuestions()}
            {step === 3 && renderPreview()}
            {step === 4 && renderEmailTemplate()}
        </div >
    );
}
