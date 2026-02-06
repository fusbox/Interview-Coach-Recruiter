import { Invite, InviteRepository } from "@/lib/domain/invite";
import pool from "@/lib/db";
import { hashToken } from "@/lib/server/crypto";

export class PostgresInviteRepository implements InviteRepository {
    async create(invite: Invite): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Insert Session
            await client.query(
                `INSERT INTO sessions (
                    session_id, recruiter_id, target_role, job_description, status, intake_json
                ) VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    invite.id,
                    invite.createdBy,
                    invite.role,
                    invite.jobDescription,
                    'NOT_STARTED',
                    { candidate: invite.candidate }
                ]
            );

            // 2. Insert Questions
            if (invite.questions && invite.questions.length > 0) {
                // Bulk insert could be optimized, but loop is fine for V1
                for (const q of invite.questions) {
                    await client.query(
                        `INSERT INTO questions (
                            session_id, question_index, question_text, competencies
                        ) VALUES ($1, $2, $3, $4)`,
                        [
                            invite.id,
                            q.index,
                            q.text,
                            { category: q.category }
                        ]
                    );
                }
            }

            // 3. Insert Token
            const tokenHash = hashToken(invite.token);
            await client.query(
                `INSERT INTO candidate_tokens (token_hash, session_id) VALUES ($1, $2)`,
                [tokenHash, invite.id]
            );

            await client.query('COMMIT');
            console.log("[PostgresRepo] Invite Created Successfully:", invite.id);
        } catch (e: any) {
            await client.query('ROLLBACK');
            console.error("[PostgresRepo] Create Transaction Failed:", e);
            console.error("[PostgresRepo] Error Code:", e.code);
            console.error("[PostgresRepo] Error Detail:", e.detail);
            throw e;
        } finally {
            client.release();
        }
    }

    async getByToken(token: string): Promise<Invite | null> {
        const tokenHash = hashToken(token);

        // Join candidate_tokens -> sessions
        // questions brought in separate query for cleaner mapping
        const result = await pool.query(
            `SELECT 
                ct.session_id, 
                s.target_role, 
                s.job_description, 
                s.recruiter_id, 
                s.created_at, 
                s.intake_json
             FROM candidate_tokens ct
             JOIN sessions s ON ct.session_id = s.session_id
             WHERE ct.token_hash = $1`,
            [tokenHash]
        );

        if (result.rows.length === 0) return null;

        const session = result.rows[0];

        // Fetch Questions
        const qResult = await pool.query(
            `SELECT question_text, question_index, competencies 
             FROM questions 
             WHERE session_id = $1 
             ORDER BY question_index ASC`,
            [session.session_id]
        );

        const questions = qResult.rows.map((q: any) => ({
            text: q.question_text,
            index: q.question_index,
            category: q.competencies?.category || "General"
        }));

        const rawCandidate = session.intake_json?.candidate || {};
        const candidate = {
            firstName: rawCandidate.firstName || "",
            lastName: rawCandidate.lastName || "",
            email: rawCandidate.email || "",
            reqId: rawCandidate.reqId || ""
        };

        return {
            id: session.session_id,
            token: token,
            role: session.target_role,
            jobDescription: session.job_description,
            candidate,
            questions,
            createdBy: session.recruiter_id,
            createdAt: new Date(session.created_at).getTime()
        };
    }
}
