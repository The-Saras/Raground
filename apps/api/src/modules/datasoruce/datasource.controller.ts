import { Request, Response } from "express";

import { DataSourceService } from "../../services/datasource.service";

const dataSourceService = new DataSourceService();

export class DataSourceController {
    async create(req: Request, res: Response) {
        const { workspaceId } = req.params as { workspaceId: string };

        const dataSource = await dataSourceService.create(
            workspaceId,
            req.body
        );

        res.status(201).json(dataSource);
    }
}