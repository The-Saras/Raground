import { Response } from "express";
import { PrismaClient, JobType } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { SearchService } from "../../services/search.service";
import { ChatService } from "../../services/chat.service";
import ingestionQueue from "../../queue/ingestion.queue";
import { v1SearchSchema, v1ChatSchema } from "./v1.validation";
import { extractTextFromFile } from "../../utils/file-extractor.util";

const prisma = new PrismaClient();
const searchService = new SearchService();
const chatService = new ChatService();

export class V1Controller {
    // 1. List accessible workspaces
    async listWorkspaces(req: AuthenticatedRequest, res: Response) {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized: User not identified" });
            return;
        }

        try {
            // If the API key is restricted to a specific workspace, return only that one
            if (req.apiKey?.workspaceId) {
                const workspace = await prisma.workspace.findFirst({
                    where: {
                        id: req.apiKey.workspaceId,
                        ownerId: req.user.id,
                    },
                    include: {
                        _count: {
                            select: {
                                dataSources: true,
                                jobs: true,
                            },
                        },
                    },
                });

                res.status(200).json(workspace ? [workspace] : []);
                return;
            }

            const workspaces = await prisma.workspace.findMany({
                where: { ownerId: req.user.id },
                orderBy: { createdAt: "desc" },
                include: {
                    _count: {
                        select: {
                            dataSources: true,
                            jobs: true,
                        },
                    },
                },
            });

            res.status(200).json(workspaces);
        } catch (error: any) {
            console.error("v1 listWorkspaces error:", error);
            res.status(500).json({ error: "Failed to fetch workspaces" });
        }
    }

    // 2. Get workspace details
    async getWorkspace(req: AuthenticatedRequest, res: Response) {
        const workspaceId = (req.params.workspaceId || req.params.id) as string;

        try {
            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                include: {
                    _count: {
                        select: {
                            dataSources: true,
                            jobs: true,
                        },
                    },
                    dataSources: {
                        take: 10,
                        orderBy: { createdAt: "desc" },
                        include: {
                            _count: {
                                select: { chunks: true },
                            },
                        },
                    },
                    jobs: {
                        take: 5,
                        orderBy: { createdAt: "desc" },
                    },
                },
            });

            if (!workspace) {
                res.status(404).json({ error: "Workspace not found" });
                return;
            }

            res.status(200).json(workspace);
        } catch (error: any) {
            console.error("v1 getWorkspace error:", error);
            res.status(500).json({ error: "Failed to fetch workspace details" });
        }
    }

    // 3. Ingest a document (JSON or file upload)
    async ingestDocument(req: AuthenticatedRequest, res: Response) {
        const workspaceId = (req.params.workspaceId || req.params.id) as string;

        let content = req.body?.content;
        let title = req.body?.title;

        // If a file was uploaded (.txt, .md, .pdf)
        if (req.file) {
            try {
                content = await extractTextFromFile(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype
                );
                title = title?.trim() || req.file.originalname;
            } catch (err: any) {
                res.status(400).json({
                    error: err.message || "Failed to parse uploaded document",
                });
                return;
            }
        }

        if (!content || typeof content !== "string" || !content.trim()) {
            res.status(400).json({
                error: "Document content is required. Either supply 'content' in JSON body or upload a .txt/.pdf file via 'file'.",
            });
            return;
        }

        try {
            const result = await prisma.$transaction(async (tx) => {
                const dataSource = await tx.dataSource.create({
                    data: {
                        title: title?.trim() || null,
                        content: content.trim(),
                        workspaceId,
                    },
                });

                const job = await tx.job.create({
                    data: {
                        workspaceId,
                        dataSourceId: dataSource.id,
                        type: JobType.INGEST,
                    },
                });

                await ingestionQueue.add("ingest", {
                    jobId: job.id,
                });

                return { dataSource, job };
            });

            res.status(202).json({
                success: true,
                message: "Document uploaded successfully. Chunking and embedding job queued.",
                document: {
                    id: result.dataSource.id,
                    title: result.dataSource.title,
                    workspaceId: result.dataSource.workspaceId,
                    createdAt: result.dataSource.createdAt,
                },
                job: {
                    id: result.job.id,
                    status: result.job.status,
                    type: result.job.type,
                },
            });
        } catch (error: any) {
            console.error("v1 ingestDocument error:", error);
            res.status(500).json({ error: error.message || "Failed to ingest document" });
        }
    }


    // 4. List documents in a workspace
    async listDocuments(req: AuthenticatedRequest, res: Response) {
        const workspaceId = (req.params.workspaceId || req.params.id) as string;

        try {
            const documents = await prisma.dataSource.findMany({
                where: { workspaceId },
                orderBy: { createdAt: "desc" },
                include: {
                    _count: {
                        select: { chunks: true },
                    },
                },
            });

            const formatted = documents.map((doc) => ({
                id: doc.id,
                title: doc.title,
                contentLength: doc.content.length,
                chunkCount: doc._count.chunks,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            }));

            res.status(200).json({
                workspaceId,
                count: formatted.length,
                documents: formatted,
            });
        } catch (error: any) {
            console.error("v1 listDocuments error:", error);
            res.status(500).json({ error: "Failed to list documents" });
        }
    }

    // 5. Get document details
    async getDocument(req: AuthenticatedRequest, res: Response) {
        const workspaceId = (req.params.workspaceId || req.params.id) as string;
        const documentId = req.params.documentId as string;

        try {
            const document = await prisma.dataSource.findFirst({
                where: {
                    id: documentId,
                    workspaceId,
                },
                include: {
                    chunks: {
                        select: {
                            id: true,
                            chunkIndex: true,
                            content: true,
                            createdAt: true,
                        },
                        orderBy: { chunkIndex: "asc" },
                    },
                },
            });

            if (!document) {
                res.status(404).json({ error: "Document not found in this workspace" });
                return;
            }

            res.status(200).json(document);
        } catch (error: any) {
            console.error("v1 getDocument error:", error);
            res.status(500).json({ error: "Failed to fetch document" });
        }
    }

    // 6. Check indexing job status
    async getJobStatus(req: AuthenticatedRequest, res: Response) {
        const workspaceId = (req.params.workspaceId || req.params.id) as string;
        const jobId = req.params.jobId as string;

        try {
            const job = await prisma.job.findFirst({
                where: {
                    id: jobId,
                    workspaceId,
                },
            });

            if (!job) {
                res.status(404).json({ error: "Job not found in this workspace" });
                return;
            }

            res.status(200).json({
                id: job.id,
                status: job.status,
                type: job.type,
                error: job.error,
                workspaceId: job.workspaceId,
                dataSourceId: job.dataSourceId,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
            });
        } catch (error: any) {
            console.error("v1 getJobStatus error:", error);
            res.status(500).json({ error: "Failed to fetch job status" });
        }
    }

    // 7. Vector semantic search
    async search(req: AuthenticatedRequest, res: Response) {
        const workspaceId = (req.params.workspaceId || req.params.id) as string;

        const parseResult = v1SearchSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: parseResult.error.issues[0]?.message || "Invalid search query payload",
            });
            return;
        }

        const { query, limit } = parseResult.data;

        try {
            const results = await searchService.search(workspaceId, query, limit);

            res.status(200).json({
                workspaceId,
                query,
                count: results.length,
                results: results.map((r) => ({
                    chunkId: r.chunkId,
                    content: r.content,
                    score: Number(r.score.toFixed(4)),
                    dataSource: {
                        id: r.dataSourceId,
                        title: r.dataSourceTitle || null,
                    },
                })),
            });
        } catch (error: any) {
            console.error("v1 search error:", error);
            res.status(500).json({ error: error.message || "Vector similarity search failed" });
        }
    }

    // 8. RAG Chat Q&A
    async chat(req: AuthenticatedRequest, res: Response) {
        const workspaceId = (req.params.workspaceId || req.params.id) as string;

        const parseResult = v1ChatSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: parseResult.error.issues[0]?.message || "Invalid chat query payload",
            });
            return;
        }

        const { query, systemPrompt, topK } = parseResult.data;

        try {
            const response = await chatService.chat(
                workspaceId,
                query,
                systemPrompt || undefined,
                topK
            );

            res.status(200).json({
                workspaceId,
                query,
                answer: response.answer,
                sources: response.sources.map((s) => ({
                    chunkId: s.chunkId,
                    content: s.content,
                    score: Number(s.score.toFixed(4)),
                    title: s.dataSourceTitle || null,
                })),
            });
        } catch (error: any) {
            console.error("v1 chat error:", error);
            res.status(500).json({ error: error.message || "RAG chat generation failed" });
        }
    }
}
