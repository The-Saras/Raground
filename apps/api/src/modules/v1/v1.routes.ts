import { Router } from "express";
import { V1Controller } from "./v1.controller";
import { unifiedAuthMiddleware } from "../../middlewares/unified-auth.middleware";
import { workspaceMiddleware } from "../../middlewares/workspace.middleware";
import { upload } from "../../middlewares/upload.middleware";

const router = Router();
const controller = new V1Controller();

// Apply unified authentication across all v1 routes (API key or JWT token)
router.use(unifiedAuthMiddleware);

// Workspace metadata endpoints
router.get("/workspaces", controller.listWorkspaces);
router.get("/workspaces/:workspaceId", workspaceMiddleware, controller.getWorkspace);

// Documents and ingestion endpoints (supports both JSON body and multipart file upload)
router.post(
    "/workspaces/:workspaceId/documents",
    workspaceMiddleware,
    upload.single("file"),
    controller.ingestDocument
);
router.get("/workspaces/:workspaceId/documents", workspaceMiddleware, controller.listDocuments);
router.get("/workspaces/:workspaceId/documents/:documentId", workspaceMiddleware, controller.getDocument);

// Ingestion Job status polling endpoint
router.get("/workspaces/:workspaceId/jobs/:jobId", workspaceMiddleware, controller.getJobStatus);

// Vector search and RAG Q&A endpoints
router.post("/workspaces/:workspaceId/search", workspaceMiddleware, controller.search);
router.post("/workspaces/:workspaceId/chat", workspaceMiddleware, controller.chat);

export default router;
