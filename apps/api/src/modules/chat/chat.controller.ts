import { Request, Response } from "express";

import { ChatService } from "../../services/chat.service";
import { chatSchema } from "./chat.validation";

const chatService = new ChatService();

export class ChatController {
    async chat(req: Request, res: Response) {
        const { workspaceId } = req.params as {
            workspaceId: string;
        };

        const result = chatSchema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({
                error: result.error.issues[0].message,
            });
            return;
        }

        const { query } = result.data;

        try {
            const response = await chatService.chat(
                workspaceId,
                query
            );

            res.status(200).json(response);
        } catch (error: any) {
            console.error("Chat controller error:", error);
            res.status(500).json({
                error: error.message || "Failed to process chat query",
            });
        }
    }
}