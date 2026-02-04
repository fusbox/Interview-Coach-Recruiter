import fs from "fs/promises";
import path from "path";
import { InterviewSession } from "@/lib/domain/types";
import { SessionRepository } from "@/lib/domain/repository";

const DATA_DIR = path.join(process.cwd(), ".data", "sessions");

export class FileSessionRepository implements SessionRepository {
    private async ensureDir() {
        try {
            await fs.access(DATA_DIR);
        } catch {
            await fs.mkdir(DATA_DIR, { recursive: true });
        }
    }

    async create(session: InterviewSession): Promise<void> {
        await this.ensureDir();
        const filePath = path.join(DATA_DIR, `${session.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(session, null, 2));
    }

    async get(id: string): Promise<InterviewSession | null> {
        await this.ensureDir();
        const filePath = path.join(DATA_DIR, `${id}.json`);
        try {
            const data = await fs.readFile(filePath, "utf-8");
            return JSON.parse(data) as InterviewSession;
        } catch (error) {
            return null;
        }
    }

    async update(session: InterviewSession): Promise<void> {
        // For file system, update is same as create (overwrite)
        return this.create(session);
    }

    async delete(id: string): Promise<void> {
        await this.ensureDir();
        const filePath = path.join(DATA_DIR, `${id}.json`);
        try {
            await fs.unlink(filePath);
        } catch {
            // Ignore if already gone
        }
    }
}
