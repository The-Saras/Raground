import { Router } from "express";

import { WorkspaceController } from "./workspace.controller";

const router = Router();
const controller = new WorkspaceController();

router.post("/", controller.create);
router.get("/", controller.getall);
router.get("/:id", controller.getById)

export default router;

/*We now have getall and getbyid apis for workspace in place integrate those apis in frontend. create a workspace page where all the available workspace will be shown and there will be a search bar*/