import fs from "fs/promises";
import path from "path";
import { Invite, InviteRepository } from "@/lib/domain/invite";

const DATA_DIR = path.join(process.cwd(), ".data", "invites");

export class FileInviteRepository implements InviteRepository {
    private async ensureDir() {
        try {
            await fs.access(DATA_DIR);
        } catch {
            await fs.mkdir(DATA_DIR, { recursive: true });
        }
    }

    async create(invite: Invite): Promise<void> {
        await this.ensureDir();
        // Index by Token for fast lookup? Or ID?
        // We look up by Token in "getByToken".
        // Let's store as `[token].json` for V1 simplicity.
        const filePath = path.join(DATA_DIR, `${invite.token}.json`);
        await fs.writeFile(filePath, JSON.stringify(invite, null, 2));
    }

    async getByToken(token: string): Promise<Invite | null> {
        await this.ensureDir();
        const filePath = path.join(DATA_DIR, `${token}.json`);
        try {
            const data = await fs.readFile(filePath, "utf-8");
            return JSON.parse(data) as Invite;
        } catch (error) {
            return null;
        }
    }
}
