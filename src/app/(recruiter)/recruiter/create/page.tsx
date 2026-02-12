"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft } from "lucide-react";
import { Details, QuestionInput, STAR_TEMPLATE, PERMA_TEMPLATE } from "./constants";

// Sub-components
import { StepDetails } from "./components/StepDetails";
import { StepQuestions } from "./components/StepQuestions";
import { StepPreview } from "./components/StepPreview";
import { StepEmail } from "./components/StepEmail";

export default function CreateInviteWizard() {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

    // Reset scroll on step change (Wizard flow)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);
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
    const [error, setError] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<string | null>(null);

    const [recruiterProfile, setRecruiterProfile] = useState({
        name: "",
        title: "",
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
    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

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

                setEmailDraft(prev => ({ ...prev, cc: user.email || "" }));
            }
        };
        fetchProfile();
    }, []);

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

    const toggleEdit = (field: string) => {
        setEditingField(prev => prev === field ? null : field);
    };

    const handleCreate = async () => {
        setIsLoading(true);
        setError(null);
        try {
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

            if (!res.ok) throw new Error(data.error || "Failed to create invite");

            if (data.link) {
                setInviteLink(`${window.location.origin}${data.link}`);
                initializeEmailDraft();
                setStep(4);
            }
        } catch (e: unknown) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Failed to create invite");
        } finally {
            setIsLoading(false);
        }
    };

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

    // Debug Helpers
    const populateDetails = () => setDetails({
        firstName: "Ian", lastName: "Caldwell", candidateEmail: "ICClearly@yopmail.com",
        reqId: "RCI-QD-18250-1", role: "Phlebotomist II", jd: details.jd
    });

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

        setTechnical([{ id: 'tech-1', text: "What techniques do you use to draw blood from pediatric patients?", category: 'Technical', label: 'Technical Q1' }]);
    };

    return (
        <div className="max-w-3xl mx-auto pb-8 pt-24 md:py-8">
            {/* Stepper Header */}
            <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 py-3 border-b md:static md:bg-transparent md:border-none md:p-0 md:m-0 md:mb-8 transition-all">
                <div className="relative">
                    <div className="absolute left-0 right-0 top-[15px] h-[2px] bg-muted/50 -z-10" />
                    <div className="flex w-full">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`flex-1 flex flex-col items-center group cursor-pointer ${s < step ? 'text-emerald-600' : (s === step ? 'text-primary' : 'text-muted-foreground')}`}
                                onClick={() => s <= step ? setStep(s as 1 | 2 | 3 | 4) : null}>
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

            {step === 1 && <StepDetails details={details} setDetails={setDetails} onNext={() => setStep(2)} onPopulateDebug={populateDetails} StepFooter={StepFooter} />}
            {step === 2 && <StepQuestions star={star} setStar={setStar} perma={perma} setPerma={setPerma} technical={technical} setTechnical={setTechnical} onBack={() => setStep(1)} onNext={() => setStep(3)} onPopulateDebug={populateQuestions} StepFooter={StepFooter} />}
            {step === 3 && <StepPreview details={details} star={star} perma={perma} technical={technical} other={other} error={error} isLoading={isLoading} onBack={() => setStep(2)} onHandleCreate={handleCreate} StepFooter={StepFooter} />}
            {step === 4 && <StepEmail emailDraft={emailDraft} setEmailDraft={setEmailDraft} recruiterProfile={recruiterProfile} editingField={editingField} toggleEdit={toggleEdit} inviteLink={inviteLink} onBack={() => setStep(3)} resetWizard={resetWizard} />}
        </div>
    );
}
