import { Router } from "express";
import { SearchController } from "./search.controller";

const router = Router();
const controller = new SearchController();

router.post("/:workspaceId/search", controller.search);

export default router;
