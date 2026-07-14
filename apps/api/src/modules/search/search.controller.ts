import { Request, Response } from "express";
import { SearchService } from "../../services/search.service";
import { searchSchema } from "./search.validation";

const searchService = new SearchService();

export class SearchController {
    async search(req: Request, res: Response) {
        const { workspaceId } = req.params as { workspaceId: string };

        const result = searchSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                error: result.error.issues[0].message,
            });
            return;
        }

        const { query } = result.data;

        const results = await searchService.search(workspaceId, query, 5);

        res.status(200).json(results);
    }
}