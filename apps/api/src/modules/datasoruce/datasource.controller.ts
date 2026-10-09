import { Request, Response } from "express";
import { DataSourceService } from "../../services/datasource.service";
import { extractTextFromFile } from "../../utils/file-extractor.util";

const dataSourceService = new DataSourceService();

export class DataSourceController {
    async create(req: Request, res: Response) {
        const { workspaceId } = req.params as { workspaceId: string };

        try {
            let content = req.body.content;
            let title = req.body.title;

            // If a file was uploaded (.txt, .md, .pdf)
            if (req.file) {
                content = await extractTextFromFile(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype
                );
                title = title?.trim() || req.file.originalname;
            }

            if (!content || typeof content !== "string" || !content.trim()) {
                res.status(400).json({
                    error: "Document content is required. Either paste raw text or upload a .txt / .pdf file.",
                });
                return;
            }

            const dataSource = await dataSourceService.create(
                workspaceId,
                {
                    title: title?.trim() || undefined,
                    content: content.trim(),
                }
            );

            res.status(201).json(dataSource);
        } catch (error: any) {
            console.error("DataSource creation error:", error);
            res.status(400).json({
                error: error.message || "Failed to create data source",
            });
        }
    }
}