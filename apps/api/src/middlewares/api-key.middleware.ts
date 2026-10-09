import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { ApiKeyService } from "../services/api-key.service";

const apiKeyService = new ApiKeyService();

export function extractApiKey(req: AuthenticatedRequest): string | null {
    // 1. Check x-api-key header (standard)
    const headerKey = req.headers["x-api-key"] || req.headers["x-api-token"];
    if (typeof headerKey === "string" && headerKey.trim()) {
        return headerKey.trim();
    }

    // 2. Check Authorization Bearer header if it starts with rg_
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        if (token && token.startsWith("rg_")) {
            return token.trim();
        }
    }

    // 3. Check query param (apiKey or api_key)
    const queryKey = req.query.apiKey || req.query.api_key;
    if (typeof queryKey === "string" && queryKey.trim()) {
        return queryKey.trim();
    }

    return null;
}

export async function apiKeyMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const rawKey = extractApiKey(req);

    if (!rawKey) {
        res.status(401).json({
            error: "Unauthorized: API key required. Provide via 'x-api-key' header or 'Authorization: Bearer rg_live_...'",
        });
        return;
    }

    try {
        const validation = await apiKeyService.validateKey(rawKey);

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

        next();
    } catch (error: any) {
        console.error("API Key authentication error:", error);
        res.status(500).json({
            error: "Internal server error during API key authentication",
        });
    }
}
