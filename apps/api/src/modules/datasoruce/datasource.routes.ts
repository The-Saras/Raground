import { Router } from "express";
import { DataSourceController } from "./datasource.controller";
import { workspaceMiddleware } from "../../middlewares/workspace.middleware";

const router = Router();
const controller = new DataSourceController();

router.post("/:workspaceId/data", workspaceMiddleware, controller.create);

export default router;