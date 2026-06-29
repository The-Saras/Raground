import { Router } from "express";

import { WorkspaceController } from "./workspace.controller";

const router = Router();
const controller = new WorkspaceController();

router.post("/", controller.create);

export default router;