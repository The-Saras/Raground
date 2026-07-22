import { Router } from "express";
import healthRoutes from "../modules/health/health.routes"
import authRoutes from "../modules/auth/auth.routes"
import workspaceRoutes from "../modules/workspace/workspace.routes"
import dataSourceRoutes from "../modules/datasoruce/datasource.routes";
import searchRoutes from "../modules/search/search.routes";
import chatRoutes from "../modules/chat/chat.routes";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

// Protect all workspaces and chat endpoints
router.use("/workspaces", authMiddleware, workspaceRoutes);
router.use("/workspaces", authMiddleware, dataSourceRoutes);
router.use("/workspaces", authMiddleware, searchRoutes);
router.use("/chat", authMiddleware, chatRoutes);

export default router;