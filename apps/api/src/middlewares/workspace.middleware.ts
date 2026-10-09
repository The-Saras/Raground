import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "./auth.middleware";

const prisma = new PrismaClient();

export async function workspaceMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const rawWorkspaceId = req.params.workspaceId || req.params.id;
    const workspaceId = Array.isArray(rawWorkspaceId) ? rawWorkspaceId[0] : rawWorkspaceId;

    if (!workspaceId || typeof workspaceId !== "string") {
        res.status(400).json({ error: "Workspace ID is required and must be a string" });
        return;
    }

    if (!req.user) {
        res.status(401).json({ error: "Unauthorized: User session or API key not authenticated" });
        return;
    }

    // If request was authenticated via API key with specific workspace scope, check restriction
    if (req.apiKey && req.apiKey.workspaceId && req.apiKey.workspaceId !== workspaceId) {
        res.status(403).json({
            error: `Forbidden: This API key is restricted to workspace '${req.apiKey.workspaceId}' and cannot access workspace '${workspaceId}'`,
        });
        return;
    }

    try {
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if (!workspace) {
            res.status(404).json({ error: `Workspace with ID '${workspaceId}' not found` });
            return;
        }

        if (workspace.ownerId !== req.user.id) {
            res.status(403).json({ error: "Access denied to this workspace" });
            return;
        }

        req.workspace = workspace;
        next();
    } catch (error: any) {
        console.error("Workspace verification error:", error);
        res.status(500).json({ error: "Internal server error during workspace validation" });
    }
}
