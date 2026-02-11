import { SessionRepository } from "@/lib/domain/repository";
import { InterviewSession, SessionSummary, Question, Answer } from "@/lib/domain/types";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Logger } from "@/lib/logger";

export class SupabaseSessionRepository implements SessionRepository {
    async create(session: InterviewSession): Promise<void> {
        // In the new model, the session might already exist if via Invite.
        // But for consistency, we Upsert the session metadata.
        await this.update(session);
    }

    async listByRecruiter(recruiterId: string): Promise<SessionSummary[]> {
        const supabase = createClient();

        // 1. Fetch Sessions
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select(`
                session_id,
                target_role,
                status,
                created_at,
                intake_json
            `)
            .eq('recruiter_id', recruiterId)
            .order('created_at', { ascending: false });

        if (error) {
            Logger.error("[SupabaseSessionRepo] List Failed", error);
            throw new Error(error.message);
        }

        if (!sessions) return [];

        // 2. Map to Summary
        // Note: For counts, we would need to join or aggregate.
        // For MVP/performance, we might skip counts or fetch them separately if critical.
        // Let's do a lightweight fetch for counts if needed, but for now 0 is fine or we can do a second query.
        // Actually, let's just return basic info first as getting counts for ALL sessions might be heavy without a view.

        return sessions.map((s: any) => {
            const c = s.intake_json?.candidate || {};
            const candidateName = (c.firstName && c.lastName)
                ? `${c.firstName} ${c.lastName}`
                : (c.name || "Anonymous Candidate");

            return {
                id: s.session_id,
                candidateName,
                role: s.target_role,
                status: s.status,
                createdAt: new Date(s.created_at).getTime(),
                questionCount: 0, // Placeholder
                answerCount: 0    // Placeholder
            };
        });
    }

    async get(id: string): Promise<InterviewSession | null> {
        // Use Admin Client to ensure we can fetch regardless of RLS,
        // trusting that the caller (API Route) has performed Auth checks.
        const supabase = createAdminClient();

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
        const questions: Question[] = qData.map((q: { question_id: string; question_text: string; question_index: number; category?: string }) => ({
            id: q.question_id,
            text: q.question_text,
            category: q.category || "General",
            index: q.question_index
            // ... competencies mapping if needed
        }));

        // Map Answers
        const answers: Record<string, Answer> = {};
        aData.forEach((a: { question_id: string; final_text: string | null; draft_text: string | null; attempt_number: number; submitted_at: string | null }) => {
            // Find analysis
            const myEval = eData?.find((e: { question_id: string; attempt_number: number; evaluation_json: unknown }) => e.question_id === a.question_id && e.attempt_number === a.attempt_number);

            answers[a.question_id] = {
                questionId: a.question_id,
                transcript: a.final_text || "",
                draft: a.draft_text || "",
                submittedAt: a.submitted_at ? new Date(a.submitted_at).getTime() : undefined,
                analysis: myEval ? myEval.feedback_json : undefined
            };
        });

        // Initials & Retry Logic
        const intake = sData.intake_json || {};
        const retryContexts = intake.retry_contexts || {};

        // Logger.info(`[SupabaseSessionRepo] Session ${id} Loaded Intake:`, intake);

        const c = intake.candidate || {};
        const candidateName = (c.firstName && c.lastName)
            ? `${c.firstName} ${c.lastName}`
            : c.name; // Fallback to legacy

        const enteredInitials = intake.entered_initials;
        // Require initials if candidate name is known but initials not yet entered
        const initialsRequired = !!candidateName && !enteredInitials;

        // Map retry contexts to answers
        Object.keys(answers).forEach(qid => {
            if (retryContexts[qid]) {
                answers[qid].retryContext = retryContexts[qid];
            }
        });

        // Logger.info(`[SupabaseSessionRepo] Initials Calc`, { candidateName, enteredInitials, initialsRequired });

        // Derive Status from Answers to fix transient state loss
        let derivedStatus = sData.status;
        if (sData.status === 'IN_SESSION') {
            const currentQ = questions.find(q => q.index === sData.current_question_index);
            if (currentQ) {
                const currentAns = answers[currentQ.id];
                if (currentAns?.submittedAt) {
                    if (currentAns.analysis) {
                        derivedStatus = 'REVIEWING';
                    } else {
                        derivedStatus = 'AWAITING_EVALUATION';
                    }
                }
            }
        }

        return {
            id: sData.session_id,
            recruiterId: sData.recruiter_id, // Map recruiter_id
            status: derivedStatus,
            role: sData.target_role,
            jobDescription: sData.job_description,
            currentQuestionIndex: sData.current_question_index,
            questions,
            answers,
            initialsRequired,
            candidateName,
            enteredInitials,
            candidate: {
                firstName: c.firstName || "",
                lastName: c.lastName || "",
                email: c.email || ""
            },
            engagedTimeSeconds: intake.engaged_time_seconds || 0,
            intakeData: intake
        };
    }

    async update(session: InterviewSession): Promise<void> {
        // Use Admin Client to bypass RLS for Candidate updates
        const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        Logger.info(`[SupabaseSessionRepo] Updating Session ${session.id}`, { usingAdmin: hasKey });

        const supabase = createAdminClient();

        // 1. Prepare Session Update
        // Map Status to valid DB Enum
        let dbStatus = session.status;
        if (session.status === "AWAITING_EVALUATION" || session.status === "REVIEWING") {
            dbStatus = "IN_SESSION";
        }

        const updates: Record<string, unknown> = {
            session_id: session.id,
            status: dbStatus,
            current_question_index: session.currentQuestionIndex,
            target_role: session.role,
            job_description: session.jobDescription
            // candidate_id: session.candidateId // REMOVED: Property does not exist on Domain Type
        };

        // Strict Merge of Intake JSON
        // We fetch explicitly to ensure we don't lose data
        const { data: current, error: fetchError } = await supabase
            .from('sessions')
            .select('intake_json')
            .eq('session_id', session.id)
            .single();

        // PGRST116 means 0 rows; expected if creating new session
        if (fetchError && fetchError.code !== 'PGRST116') {
            Logger.error("Update Fetch Error", fetchError);
        }

        const currentIntake = current?.intake_json || {};

        // If 'enteredInitials' is present in the Domain Object, ensure it persists.
        // If it's NOT present (e.g. legacy object), keep what's in DB.
        const nextEnteredInitials = session.enteredInitials || currentIntake.entered_initials;
        // Also persist engagedTimeSeconds
        const nextEngagedTimeSeconds = session.engagedTimeSeconds !== undefined ? session.engagedTimeSeconds : currentIntake.engaged_time_seconds;

        // Collect retry contexts from answers
        const nextRetryContexts = currentIntake.retry_contexts || {};
        Object.values(session.answers).forEach(ans => {
            if (ans.retryContext) {
                nextRetryContexts[ans.questionId] = ans.retryContext;
            }
        });

        updates.intake_json = {
            ...currentIntake,
            entered_initials: nextEnteredInitials,
            engaged_time_seconds: nextEngagedTimeSeconds,
            retry_contexts: nextRetryContexts
        };

        const { error: sessionError } = await supabase
            .from('sessions')
            .upsert(updates);

        if (sessionError) {
            Logger.error("[Repo] Session Update Failed", sessionError);
            throw new Error(sessionError.message);
        }


        // 2. Upsert Questions
        if (session.questions.length > 0) {
            const qRows = session.questions.map((q, idx) => ({
                question_id: q.id,
                session_id: session.id,
                question_index: idx,
                question_text: q.text,
                category: q.category
            }));
            const { error: qError } = await supabase.from('questions').upsert(qRows);
            if (qError) Logger.error("Question Update Error", qError);
        }

        // 3. Upsert Answers & Evals
        const aRows = [];
        const eRows = [];

        for (const [qid, ans] of Object.entries(session.answers)) {
            aRows.push({
                question_id: qid,
                session_id: session.id,
                final_text: ans.transcript,
                draft_text: ans.draft,
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
            if (aError) Logger.error("Answer Update Error", aError);
        }

        if (eRows.length > 0) {
            const { error: eError } = await supabase
                .from('eval_results')
                .upsert(eRows, { onConflict: 'question_id, attempt_number' });
            if (eError) Logger.error("Eval Update Error", eError);
        }
    }

    async updatePartial(id: string, updates: Partial<InterviewSession>): Promise<void> {
        const supabase = createAdminClient();
        // Logger.debug(`[SupabaseSessionRepo] updatePartial ${id}`, Object.keys(updates));

        const dbUpdates: Record<string, unknown> = {};

        // 1. Metadata Updates
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

        // 2. Intake JSON Updates (Partial Merge)
        const hasAnswerRetryContext = updates.answers && Object.values(updates.answers).some(a => !!a.retryContext);

        if (updates.engagedTimeSeconds !== undefined || updates.enteredInitials !== undefined || hasAnswerRetryContext) {
            const { data: current, error: fetchError } = await supabase
                .from('sessions')
                .select('intake_json')
                .eq('session_id', id)
                .single();

            if (!fetchError && current) {
                const currentIntake = current.intake_json || {};
                const currentRetryContexts = currentIntake.retry_contexts || {};

                // Merge new retry contexts
                if (updates.answers) {
                    Object.values(updates.answers).forEach(ans => {
                        if (ans.retryContext) {
                            currentRetryContexts[ans.questionId] = ans.retryContext;
                        }
                    });
                }

                dbUpdates.intake_json = {
                    ...currentIntake,
                    ...(updates.enteredInitials !== undefined && { entered_initials: updates.enteredInitials }),
                    ...(updates.engagedTimeSeconds !== undefined && { engaged_time_seconds: updates.engagedTimeSeconds }),
                    retry_contexts: currentRetryContexts
                };
            }
        }

        if (Object.keys(dbUpdates).length > 0) {
            const { error } = await supabase
                .from('sessions')
                .update(dbUpdates)
                .eq('session_id', id);

            if (error) {
                Logger.error("[Repo] Partial Update Failed", error);
                throw new Error(error.message);
            }
        }

        // 3. Questions Upsert
        if (updates.questions && updates.questions.length > 0) {
            const qRows = updates.questions.map((q, idx) => ({
                question_id: q.id,
                session_id: id,
                question_index: idx,
                question_text: q.text,
                category: q.category
            }));
            const { error: qError } = await supabase.from('questions').upsert(qRows);
            if (qError) Logger.error("Question Partial Update Error", qError);
        }

        // 4. Answers & Evals Upsert
        if (updates.answers) {
            const aRows = [];
            const eRows = [];

            for (const [qid, ans] of Object.entries(updates.answers)) {
                aRows.push({
                    question_id: qid,
                    session_id: id,
                    final_text: ans.transcript,
                    draft_text: ans.draft,
                    submitted_at: ans.submittedAt ? new Date(ans.submittedAt).toISOString() : null,
                    modality: 'text'
                });

                if (ans.analysis) {
                    eRows.push({
                        question_id: qid,
                        session_id: id,
                        status: 'COMPLETE',
                        feedback_json: ans.analysis
                    });
                }
            }

            if (aRows.length > 0) {
                const { error: aError } = await supabase
                    .from('answers')
                    .upsert(aRows, { onConflict: 'question_id, attempt_number' });
                if (aError) Logger.error("Answer Partial Update Error", aError);
            }

            if (eRows.length > 0) {
                const { error: eError } = await supabase
                    .from('eval_results')
                    .upsert(eRows, { onConflict: 'question_id, attempt_number' });
                if (eError) Logger.error("Eval Partial Update Error", eError);
            }
        }
    }


    async saveDraft(sessionId: string, questionId: string, draftText: string): Promise<void> {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('answers')
            .update({ draft_text: draftText })
            .eq('session_id', sessionId)
            .eq('question_id', questionId)
            .select();

        if (error) throw new Error(error.message);

        // If no rows updated, insert.
        if (!data || data.length === 0) {
            // Row doesn't exist, insert it
            const { error: insertError } = await supabase
                .from('answers')
                .insert({
                    session_id: sessionId,
                    question_id: questionId,
                    draft_text: draftText,
                    modality: 'text'
                });

            if (insertError) Logger.error("[Repo] SaveDraft Insert Failed", insertError);
        }
    }

    async deleteAnalysis(sessionId: string, questionId: string): Promise<void> {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('eval_results')
            .delete()
            .eq('session_id', sessionId)
            .eq('question_id', questionId);

        if (error) {
            Logger.error("[Repo] Delete Analysis Failed", error);
        }
    }

    async delete(id: string): Promise<void> {
        // Use createClient directly
        const supabaseClient = createClient();
        await supabaseClient.from('sessions').delete().eq('session_id', id);
    }
}
