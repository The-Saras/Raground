import { Request, Response } from "express";

import { WorkspaceService } from "../../services/workspace.service";

const workspaceService = new WorkspaceService();

export class WorkspaceController {
    async create(req: Request, res: Response) {
        const workspace = await workspaceService.create(
            "demo-user-id",
            req.body
        );

        res.status(201).json(workspace);
    }
}