import { Router } from "express";
import healthRoutes from "../modules/health/health.routes"
import authRoutes from "../modules/auth/auth.routes"
import workspaceRoutes from "../modules/workspace/workspace.routes"
import dataSourceRoutes from "../modules/datasoruce/datasource.routes";
import searchRoutes from "../modules/search/search.routes";
import chatRoutes from "../modules/chat/chat.routes";
import apiKeyRoutes from "../modules/api-keys/api-keys.routes";
import v1Routes from "../modules/v1/v1.routes";
import { unifiedAuthMiddleware } from "../middlewares/unified-auth.middleware";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

// Protected routes (accepts either JWT user session or API Key)
router.use("/workspaces", unifiedAuthMiddleware, workspaceRoutes);
router.use("/workspaces", unifiedAuthMiddleware, dataSourceRoutes);
router.use("/workspaces", unifiedAuthMiddleware, searchRoutes);
router.use("/chat", unifiedAuthMiddleware, chatRoutes);
router.use("/keys", unifiedAuthMiddleware, apiKeyRoutes);

// Dedicated Versioned Developer REST API (/api/v1/...)
router.use("/v1", v1Routes);

export default router;