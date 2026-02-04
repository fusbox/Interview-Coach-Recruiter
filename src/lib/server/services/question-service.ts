import { Question } from "@/lib/domain/types";
import { uuidv7 } from "uuidv7";

export class QuestionService {
    static async generateQuestions(role: string): Promise<Question[]> {
        // MOCK LOGIC - To be replaced by Gemini Generator
        // This isolates the "Business Logic" of what questions to ask.

        return [
            {
                id: uuidv7(),
                text: `Tell me about a time you had to lead a ${role} initiative under tight deadlines.`,
                category: "Behavioral",
                framework: "STAR",
                index: 0
            },
            {
                id: uuidv7(),
                text: "How do you prioritize conflicting stakeholder requirements?",
                category: "Technical",
                framework: "Problem-Solving",
                index: 1
            },
            {
                id: uuidv7(),
                text: "Describe your approach to product discovery.",
                category: "Technical",
                framework: "Process",
                index: 2
            }
        ];
    }
}
