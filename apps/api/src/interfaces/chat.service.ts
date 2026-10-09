import { ChatResponse } from "../modules/chat/chat.types";

export interface IChatService {
    chat(
        workspaceId: string,
        query: string,
        systemPrompt?: string,
        topK?: number
    ): Promise<ChatResponse>;
}