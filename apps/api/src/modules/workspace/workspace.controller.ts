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
    async getall(req: AuthenticatedRequest, res: Response) {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized: User not identified" });
            return;
        }

        const allWorkspaces = await workspaceService.getAll(
            req.user.id,
        )
        return res.status(201).json(allWorkspaces)
    }
    async getById(req: AuthenticatedRequest, res: Response) {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized: User not identified" })
            return;
        }
        const id = req.params.id;
        const workspace = await workspaceService.getById(
            req.user.id,
            id as string
        )
        return res.status(201).json(workspace)
    }

}

