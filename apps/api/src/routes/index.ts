import { Router } from "express";
import healthRoutes from "../modules/health/health.routes"
import workspaceRoutes from "../modules/workspace/workspace.routes"
import dataSourceRoutes from "../modules/datasoruce/datasource.routes";
import searchRoutes from "../modules/search/search.routes";
import chatRoutes from "../modules/chat/chat.routes";

const router = Router();

router.use("/health", healthRoutes);

router.use("/workspaces", workspaceRoutes);

router.use("/workspaces", dataSourceRoutes);

router.use("/workspaces", searchRoutes);

router.use("/chat", chatRoutes);



export default router;