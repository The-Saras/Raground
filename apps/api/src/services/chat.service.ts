import { IChatService } from "../interfaces/chat.service";
import { ChatResponse } from "../modules/chat/chat.types";
import { SearchService } from "./search.service";

import { GroqChatProvider } from "@raground/ai";

const searchService = new SearchService();
const chatProvider = new GroqChatProvider();

export class ChatService implements IChatService {
    async chat(
        workspaceId: string,
        query: string
    ): Promise<ChatResponse> {

        const sources = await searchService.search(
            workspaceId,
            query,
            5
        );

        const context = sources
            .map((source) => source.content)
            .join("\n\n");

        const prompt = `
You are a helpful AI assistant.

Answer the user's question using ONLY the context below.

If the answer is not contained in the context, say:
"I couldn't find that information in the provided documents."

Context:
${context}

Question:
${query}

Answer:
`;

        const answer = await chatProvider.generateResponse(prompt);

        return {
            answer,
            sources,
        };
    }
}