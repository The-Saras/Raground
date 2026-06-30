import { Router } from "express";

import { DataSourceController } from "./datasource.controller";

const router = Router();
const controller = new DataSourceController();

router.post("/:workspaceId/data", controller.create);

export default router;