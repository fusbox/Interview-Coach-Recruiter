import { SessionRepository } from "@/lib/domain/repository";
import { InterviewSession, Question, Answer } from "@/lib/domain/types";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export class SupabaseSessionRepository implements SessionRepository {
    async create(session: InterviewSession): Promise<void> {
        // In the new model, the session might already exist if via Invite.
        // But for consistency, we Upsert the session metadata.
        await this.update(session);
    }

    async get(id: string): Promise<InterviewSession | null> {
        const supabase = createClient();

        // 1. Fetch Session Metadata
        const { data: sData, error: sError } = await supabase
            .from('sessions')
            .select('*')
            .eq('session_id', id)
            .single();

        if (sError || !sData) return null;

        // 2. Fetch Questions
        const { data: qData, error: qError } = await supabase
            .from('questions')
            .select('*')
            .eq('session_id', id)
            .order('question_index');

        if (qError) throw new Error(qError.message);

        // 3. Fetch Answers
        // We only care about the latest attempt for V1 reconstruction usually,
        // or we map all. The domain `answers` is Record<questionId, Answer>.
        // Domain `Answer` stores `transcript`, `analysis`.
        // DB `answers` stores `draft_text`, `final_text`.
        // DB `eval_results` stores `feedback_json`.
        // This mapping is where the complexity lies.

        const { data: aData, error: aError } = await supabase
            .from('answers')
            .select('*')
            .eq('session_id', id);

        if (aError) throw new Error(aError.message);

        // Fetch Eval Results
        const { data: eData } = await supabase
            .from('eval_results')
            .select('*')
            .eq('session_id', id);

        // Map Questions
        const questions: Question[] = qData.map((q: any) => ({
            id: q.question_id,
            text: q.question_text,
            category: "General", // Default value as DB schema might not have category column yet
            index: q.question_index
            // ... competencies mapping if needed
        }));

        // Map Answers
        const answers: Record<string, Answer> = {};
        aData.forEach((a: any) => {
            // Find analysis
            const myEval = eData?.find((e: any) => e.question_id === a.question_id && e.attempt_number === a.attempt_number);

            answers[a.question_id] = {
                questionId: a.question_id,
                transcript: a.final_text || a.draft_text || "",
                submittedAt: a.submitted_at ? new Date(a.submitted_at).getTime() : undefined,
                analysis: myEval ? myEval.feedback_json : undefined
            };
        });

        // Initials Logic
        const intake = sData.intake_json || {};
        console.log(`[SupabaseSessionRepo] Session ${id} Loaded Intake:`, JSON.stringify(intake));

        const c = intake.candidate || {};
        const candidateName = (c.firstName && c.lastName)
            ? `${c.firstName} ${c.lastName}`
            : c.name; // Fallback to legacy

        const enteredInitials = intake.entered_initials;
        // Require initials if candidate name is known but initials not yet entered
        const initialsRequired = !!candidateName && !enteredInitials;

        console.log(`[SupabaseSessionRepo] Initials Calc -> Name: "${candidateName}", Entered: "${enteredInitials}", Required: ${initialsRequired}`);

        return {
            id: sData.session_id,
            status: sData.status,
            role: sData.target_role,
            jobDescription: sData.job_description,
            currentQuestionIndex: sData.current_question_index,
            questions,
            answers,
            initialsRequired,
            candidateName, // Pass to UI for validation
            enteredInitials,
            candidate: {
                firstName: c.firstName || "",
                lastName: c.lastName || "",
                email: c.email || ""
            },
            engagedTimeSeconds: intake.engaged_time_seconds || 0
        };
    }

    async update(session: InterviewSession): Promise<void> {
        // Use Admin Client to bypass RLS for Candidate updates
        const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log(`[SupabaseSessionRepo] Updating Session ${session.id} (Using Admin Client? ${hasKey})`);

        const supabase = createAdminClient();

        // 1. Prepare Session Update
        // Map Status to valid DB Enum
        let dbStatus = session.status;
        if (session.status === "AWAITING_EVALUATION" || session.status === "REVIEWING") {
            dbStatus = "IN_SESSION";
        }

        const updates: any = {
            session_id: session.id,
            status: dbStatus,
            current_question_index: session.currentQuestionIndex,
            target_role: session.role,
            job_description: session.jobDescription
        };

        // Strict Merge of Intake JSON
        // We fetch explicitly to ensure we don't lose data
        const { data: current, error: fetchError } = await supabase
            .from('sessions')
            .select('intake_json')
            .eq('session_id', session.id)
            .single();

        if (fetchError) console.error("Update Fetch Error:", fetchError);

        const currentIntake = current?.intake_json || {};

        // If 'enteredInitials' is present in the Domain Object, ensure it persists.
        // If it's NOT present (e.g. legacy object), keep what's in DB.
        const nextEnteredInitials = session.enteredInitials || currentIntake.entered_initials;
        // Also persist engagedTimeSeconds
        const nextEngagedTimeSeconds = session.engagedTimeSeconds !== undefined ? session.engagedTimeSeconds : currentIntake.engaged_time_seconds;

        updates.intake_json = {
            ...currentIntake,
            entered_initials: nextEnteredInitials,
            engaged_time_seconds: nextEngagedTimeSeconds
        };

        const { error: sessionError } = await supabase
            .from('sessions')
            .upsert(updates);

        if (sessionError) {
            console.error("[Repo] Session Update Failed:", sessionError);
            throw new Error(sessionError.message);
        }


        // 2. Upsert Questions
        if (session.questions.length > 0) {
            const qRows = session.questions.map((q, idx) => ({
                question_id: q.id,
                session_id: session.id,
                question_index: idx,
                question_text: q.text
            }));
            const { error: qError } = await supabase.from('questions').upsert(qRows);
            if (qError) console.error("Question Update Error:", qError);
        }

        // 3. Upsert Answers & Evals
        const aRows = [];
        const eRows = [];

        for (const [qid, ans] of Object.entries(session.answers)) {
            aRows.push({
                question_id: qid,
                session_id: session.id,
                final_text: ans.transcript,
                submitted_at: ans.submittedAt ? new Date(ans.submittedAt).toISOString() : null,
                modality: 'text'
            });

            if (ans.analysis) {
                eRows.push({
                    question_id: qid,
                    session_id: session.id,
                    status: 'COMPLETE',
                    feedback_json: ans.analysis
                });
            }
        }

        if (aRows.length > 0) {
            const { error: aError } = await supabase
                .from('answers')
                .upsert(aRows, { onConflict: 'question_id, attempt_number' });
            if (aError) console.error("Answer Update Error:", aError);
        }

        if (eRows.length > 0) {
            const { error: eError } = await supabase
                .from('eval_results')
                .upsert(eRows, { onConflict: 'question_id, attempt_number' });
            if (eError) console.error("Eval Update Error:", eError);
        }
    }

    async updateMetadata(id: string, updates: Partial<InterviewSession>): Promise<void> {
        const supabase = createAdminClient();
        // console.log(`[SupabaseSessionRepo] updateMetadata ${id}`, Object.keys(updates));

        const dbUpdates: any = {};

        // Map top-level fields
        if (updates.status) {
            let dbStatus = updates.status;
            if (updates.status === "AWAITING_EVALUATION" || updates.status === "REVIEWING") {
                dbStatus = "IN_SESSION";
            }
            dbUpdates.status = dbStatus;
        }
        if (updates.currentQuestionIndex !== undefined) dbUpdates.current_question_index = updates.currentQuestionIndex;
        if (updates.role) dbUpdates.target_role = updates.role;
        if (updates.jobDescription) dbUpdates.job_description = updates.jobDescription;

        // Handle JSON fields (intake_json)
        if (updates.engagedTimeSeconds !== undefined || updates.enteredInitials !== undefined) {
            const { data: current, error: fetchError } = await supabase
                .from('sessions')
                .select('intake_json')
                .eq('session_id', id)
                .single();

            if (!fetchError && current) {
                const currentIntake = current.intake_json || {};
                dbUpdates.intake_json = {
                    ...currentIntake,
                    ...(updates.enteredInitials !== undefined && { entered_initials: updates.enteredInitials }),
                    ...(updates.engagedTimeSeconds !== undefined && { engaged_time_seconds: updates.engagedTimeSeconds })
                };
            }
        }

        if (Object.keys(dbUpdates).length === 0) return;

        const { error } = await supabase
            .from('sessions')
            .update(dbUpdates)
            .eq('session_id', id);

        if (error) {
            console.error("[Repo] Metadata Update Failed:", error);
            throw new Error(error.message);
        }
    }


    async delete(id: string): Promise<void> {
        const supabase = createClient();
        await supabase.from('sessions').delete().eq('session_id', id);
    }
}
