import { Router } from "express";
import healthRoutes from "../modules/health/health.routes"
import workspaceRoutes from "../modules/workspace/workspace.routes"
import dataSourceRoutes from "../modules/datasoruce/datasource.routes";

const router = Router();

router.use("/health", healthRoutes);

router.use("/workspaces", workspaceRoutes);

router.use("/workspaces", dataSourceRoutes);

export default router;