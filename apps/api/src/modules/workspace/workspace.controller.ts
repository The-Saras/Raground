import { Response } from "express";
import { WorkspaceService } from "../../services/workspace.service";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

const workspaceService = new WorkspaceService();

export class WorkspaceController {
    async create(req: AuthenticatedRequest, res: Response) {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized: User not identified" });
            return;
        }

        const workspace = await workspaceService.create(
            req.user.id,
            req.body
        );

        res.status(201).json(workspace);
    }
}