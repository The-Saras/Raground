import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { ApiKeyService } from "../../services/api-key.service";
import { createApiKeySchema } from "./api-keys.validation";

const apiKeyService = new ApiKeyService();

export class ApiKeysController {
    async create(req: AuthenticatedRequest, res: Response) {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized: User not identified" });
            return;
        }

        const parseResult = createApiKeySchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: parseResult.error.issues[0]?.message || "Invalid input data",
            });
            return;
        }

        try {
            const result = await apiKeyService.create(req.user.id, parseResult.data);
            res.status(201).json(result);
        } catch (error: any) {
            console.error("API Key create error:", error);
            res.status(400).json({ error: error.message || "Failed to create API key" });
        }
    }

    async getAll(req: AuthenticatedRequest, res: Response) {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized: User not identified" });
            return;
        }

        try {
            const keys = await apiKeyService.getAll(req.user.id);
            res.status(200).json(keys);
        } catch (error: any) {
            console.error("API Key getAll error:", error);
            res.status(500).json({ error: "Failed to fetch API keys" });
        }
    }

    async delete(req: AuthenticatedRequest, res: Response) {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized: User not identified" });
            return;
        }

        const { id } = req.params as { id: string };
        if (!id) {
            res.status(400).json({ error: "API Key ID is required" });
            return;
        }

        try {
            const deleted = await apiKeyService.delete(req.user.id, id);
            if (!deleted) {
                res.status(404).json({ error: "API key not found or already deleted" });
                return;
            }

            res.status(200).json({ success: true, message: "API key successfully revoked" });
        } catch (error: any) {
            console.error("API Key delete error:", error);
            res.status(500).json({ error: "Failed to delete API key" });
        }
    }
}
