import { Router } from "express";
import { ChatController } from "./chat.controller";
import { workspaceMiddleware } from "../../middlewares/workspace.middleware";

const router = Router();
const controller = new ChatController();

router.post("/:workspaceId", workspaceMiddleware, controller.chat);

export default router;