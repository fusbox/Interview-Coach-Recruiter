import { InterviewSession } from "./types";

export interface SessionRepository {
    create(session: InterviewSession): Promise<void>;
    get(id: string): Promise<InterviewSession | null>;
    update(session: InterviewSession): Promise<void>;
    updateMetadata(id: string, updates: Partial<InterviewSession>): Promise<void>;
    delete(id: string): Promise<void>;
}
