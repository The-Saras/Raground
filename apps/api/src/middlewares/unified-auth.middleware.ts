import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "./auth.middleware";
import { extractApiKey } from "./api-key.middleware";
import { ApiKeyService } from "../services/api-key.service";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-this-in-production";
const apiKeyService = new ApiKeyService();

export async function unifiedAuthMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const rawApiKey = extractApiKey(req);

    // 1. If an API key is detected, authenticate with API key
    if (rawApiKey) {
        try {
            const validation = await apiKeyService.validateKey(rawApiKey);

            if (!validation) {
                res.status(401).json({
                    error: "Unauthorized: Invalid or expired API key",
                });
                return;
            }

            req.user = {
                id: validation.user.id,
                email: validation.user.email,
            };
            req.apiKey = validation.apiKey;
            req.authType = "api_key";

            return next();
        } catch (error: any) {
            console.error("Unified auth (API key) error:", error);
            res.status(500).json({ error: "Internal server error during authentication" });
            return;
        }
    }

    // 2. Otherwise, check for JWT Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as {
                userId: string;
                email: string;
            };

            req.user = {
                id: decoded.userId,
                email: decoded.email,
            };
            req.authType = "jwt";

            return next();
        } catch (error) {
            res.status(401).json({
                error: "Unauthorized: Invalid or expired JWT token",
            });
            return;
        }
    }

    // 3. Neither authentication method was supplied
    res.status(401).json({
        error: "Unauthorized: Authentication required. Provide an API key ('x-api-key' or 'Bearer rg_live_...') or JWT session token.",
    });
}
