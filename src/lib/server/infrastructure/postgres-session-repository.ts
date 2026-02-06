import { SessionRepository } from "@/lib/domain/repository";
import { InterviewSession, Question, Answer } from "@/lib/domain/types";
import pool from "@/lib/db";

export class PostgresSessionRepository implements SessionRepository {
    async create(session: InterviewSession): Promise<void> {
        await this.update(session);
    }

    async get(id: string): Promise<InterviewSession | null> {
        const sRes = await pool.query(
            `SELECT * FROM sessions WHERE session_id = $1`,
            [id]
        );
        if (sRes.rows.length === 0) return null;
        const sData = sRes.rows[0];

        // Fetch Questions
        const qRes = await pool.query(
            `SELECT * FROM questions WHERE session_id = $1 ORDER BY question_index ASC`,
            [id]
        );

        // Fetch Answers
        const aRes = await pool.query(
            `SELECT * FROM answers WHERE session_id = $1`,
            [id]
        );

        // Fetch Evals
        const eRes = await pool.query(
            `SELECT * FROM eval_results WHERE session_id = $1`,
            [id]
        );

        const questions: Question[] = qRes.rows.map((q: any) => ({
            id: q.question_id,
            text: q.question_text,
            category: "General",
            index: q.question_index
        }));

        const answers: Record<string, Answer> = {};
        aRes.rows.forEach((a: any) => {
            const myEval = eRes.rows.find((e: any) =>
                e.question_id === a.question_id && e.attempt_number === a.attempt_number
            );

            answers[a.question_id] = {
                questionId: a.question_id,
                transcript: a.final_text || a.draft_text || "",
                submittedAt: a.submitted_at ? new Date(a.submitted_at).getTime() : undefined,
                analysis: myEval ? myEval.feedback_json : undefined
            };
        });

        const intake = sData.intake_json || {};
        const c = intake.candidate || {};
        const candidateName = (c.firstName && c.lastName)
            ? `${c.firstName} ${c.lastName}`
            : c.name;

        return {
            id: sData.session_id,
            status: sData.status,
            role: sData.target_role,
            jobDescription: sData.job_description,
            currentQuestionIndex: sData.current_question_index,
            questions,
            answers,
            initialsRequired: !!candidateName && !intake.entered_initials,
            enteredInitials: intake.entered_initials,
            candidateName
        };
    }

    async update(session: InterviewSession): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Update Session
            // We need to merge intake_json if enteredInitials changed
            let intakeJsonUpdate = "";
            let params = [
                session.status,
                session.currentQuestionIndex,
                session.role,
                session.jobDescription,
                session.id
            ];

            if (session.enteredInitials) {
                // Fetch existing first to merge (concurrency risk accepted for V1)
                const currentRes = await client.query(`SELECT intake_json FROM sessions WHERE session_id = $1`, [session.id]);
                const currentIntake = currentRes.rows[0]?.intake_json || {};
                const newIntake = { ...currentIntake, entered_initials: session.enteredInitials };

                // Add to update
                await client.query(
                    `UPDATE sessions SET 
                        status = $1, current_question_index = $2, target_role = $3, job_description = $4, intake_json = $5, updated_at = NOW()
                     WHERE session_id = $6`,
                    [...params.slice(0, 4), newIntake, session.id]
                );
            } else {
                await client.query(
                    `UPDATE sessions SET 
                        status = $1, current_question_index = $2, target_role = $3, job_description = $4, updated_at = NOW()
                     WHERE session_id = $5`,
                    params
                );
            }

            // 2. Upsert Answers
            // Postgres UPSERT: INSERT ... ON CONFLICT (qs, att) DO UPDATE
            for (const [qid, ans] of Object.entries(session.answers)) {
                await client.query(
                    `INSERT INTO answers (
                        answer_id, session_id, question_id, attempt_number, modality, final_text, submitted_at, updated_at
                     ) VALUES (gen_random_uuid(), $1, $2, 1, 'text', $3, $4, NOW())
                     ON CONFLICT (question_id, attempt_number) 
                     DO UPDATE SET final_text = EXCLUDED.final_text, submitted_at = EXCLUDED.submitted_at, updated_at = NOW()`,
                    [
                        session.id,
                        qid,
                        ans.transcript,
                        ans.submittedAt ? new Date(ans.submittedAt).toISOString() : null
                    ]
                );

                if (ans.analysis) {
                    await client.query(
                        `INSERT INTO eval_results (
                            eval_id, session_id, question_id, attempt_number, status, feedback_json, updated_at
                         ) VALUES (gen_random_uuid(), $1, $2, 1, 'COMPLETE', $3, NOW())
                         ON CONFLICT (question_id, attempt_number) 
                         DO UPDATE SET feedback_json = EXCLUDED.feedback_json, status = 'COMPLETE', updated_at = NOW()`,
                        [session.id, qid, ans.analysis]
                    );
                }
            }

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async delete(id: string): Promise<void> {
        await pool.query(`DELETE FROM sessions WHERE session_id = $1`, [id]);
    }
}
