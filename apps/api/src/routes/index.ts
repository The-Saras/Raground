import { Router } from "express";
import healthRoutes from "../modules/health/health.routes"
import workspaceRoutes from "../modules/workspace/workspace.routes"

const router = Router();

router.use("/health", healthRoutes);

router.use("/workspaces", workspaceRoutes);

export default router;