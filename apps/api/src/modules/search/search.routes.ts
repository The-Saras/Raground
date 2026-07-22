import { Router } from "express";
import { SearchController } from "./search.controller";
import { workspaceMiddleware } from "../../middlewares/workspace.middleware";

const router = Router();
const controller = new SearchController();

router.post("/:workspaceId/search", workspaceMiddleware, controller.search);

export default router;
