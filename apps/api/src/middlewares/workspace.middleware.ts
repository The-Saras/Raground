import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "./auth.middleware";

const prisma = new PrismaClient();

export async function workspaceMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const { workspaceId } = req.params;

    if (!workspaceId || typeof workspaceId !== "string") {
        res.status(400).json({ error: "Workspace ID is required and must be a string" });
        return;
    }

    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    try {
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if (!workspace) {
            res.status(404).json({ error: "Workspace not found" });
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
