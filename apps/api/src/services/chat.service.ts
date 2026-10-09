import { IChatService } from "../interfaces/chat.service";
import { ChatResponse } from "../modules/chat/chat.types";
import { SearchService } from "./search.service";

import { GroqChatProvider } from "@raground/ai";

const searchService = new SearchService();
const chatProvider = new GroqChatProvider();

export class ChatService implements IChatService {
    async chat(
        workspaceId: string,
        query: string,
        systemPrompt?: string,
        topK: number = 5
    ): Promise<ChatResponse> {

        const sources = await searchService.search(
            workspaceId,
            query,
            topK
        );

        const context = sources.length > 0
            ? sources
                .map((source, index) => `[Document ${index + 1}${source.dataSourceTitle ? ` - ${source.dataSourceTitle}` : ""}]:\n${source.content}`)
                .join("\n\n")
            : "No relevant documents found.";

        const systemInstruction = systemPrompt || `You are a helpful and precise AI assistant. Answer the user's question using ONLY the provided context. If the answer is not contained in the context, say: "I couldn't find that information in the provided documents."`;

        const prompt = `${systemInstruction}

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