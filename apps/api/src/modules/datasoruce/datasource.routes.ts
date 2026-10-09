import { Router } from "express";
import { DataSourceController } from "./datasource.controller";
import { workspaceMiddleware } from "../../middlewares/workspace.middleware";
import { upload } from "../../middlewares/upload.middleware";

const router = Router();
const controller = new DataSourceController();

// Support both JSON body and multipart file upload (field name: 'file' or 'document')
router.post(
    "/:workspaceId/data",
    workspaceMiddleware,
    upload.single("file"),
    controller.create
);

export default router;