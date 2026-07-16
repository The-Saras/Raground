import { ChatResponse } from "../modules/chat/chat.types";

export interface IChatService {
    chat(workspaceId: string, query: string): Promise<ChatResponse>;
}