import { PrismaClient } from "@prisma/client";
import { IApiKeyService, ValidatedApiKeyResult } from "../interfaces/api-key.service";
import { CreateApiKeyDto, ApiKeyResponseDto } from "../modules/api-keys/api-keys.types";
import { generateApiKey, hashApiKey } from "../utils/api-key.util";

const prisma = new PrismaClient();

export class ApiKeyService implements IApiKeyService {
    async create(
        userId: string,
        data: CreateApiKeyDto
    ): Promise<{ apiKey: ApiKeyResponseDto; rawKey: string }> {
        // If scoped to a workspace, verify user owns the workspace
        if (data.workspaceId) {
            const workspace = await prisma.workspace.findFirst({
                where: {
                    id: data.workspaceId,
                    ownerId: userId,
                },
            });

            if (!workspace) {
                throw new Error("Workspace not found or unauthorized");
            }
        }

        const { rawKey, keyHash, keyPreview } = generateApiKey();

        let expiresAt: Date | null = null;
        if (data.expiresInDays && data.expiresInDays > 0) {
            expiresAt = new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000);
        }

        const created = await prisma.apiKey.create({
            data: {
                name: data.name,
                keyHash,
                keyPreview,
                userId,
                workspaceId: data.workspaceId || null,
                expiresAt,
            },
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const apiKeyResponse: ApiKeyResponseDto = {
            id: created.id,
            name: created.name,
            keyPreview: created.keyPreview,
            rawKey,
            workspaceId: created.workspaceId,
            workspace: created.workspace,
            lastUsedAt: created.lastUsedAt,
            expiresAt: created.expiresAt,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
        };

        return {
            apiKey: apiKeyResponse,
            rawKey,
        };
    }

    async getAll(userId: string): Promise<ApiKeyResponseDto[]> {
        const keys = await prisma.apiKey.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return keys.map((k) => ({
            id: k.id,
            name: k.name,
            keyPreview: k.keyPreview,
            workspaceId: k.workspaceId,
            workspace: k.workspace,
            lastUsedAt: k.lastUsedAt,
            expiresAt: k.expiresAt,
            createdAt: k.createdAt,
            updatedAt: k.updatedAt,
        }));
    }

    async getById(userId: string, id: string): Promise<ApiKeyResponseDto | null> {
        const key = await prisma.apiKey.findFirst({
            where: { id, userId },
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!key) return null;

        return {
            id: key.id,
            name: key.name,
            keyPreview: key.keyPreview,
            workspaceId: key.workspaceId,
            workspace: key.workspace,
            lastUsedAt: key.lastUsedAt,
            expiresAt: key.expiresAt,
            createdAt: key.createdAt,
            updatedAt: key.updatedAt,
        };
    }

    async delete(userId: string, id: string): Promise<boolean> {
        const key = await prisma.apiKey.findFirst({
            where: { id, userId },
        });

        if (!key) {
            return false;
        }

        await prisma.apiKey.delete({
            where: { id },
        });

        return true;
    }

    async validateKey(rawKey: string): Promise<ValidatedApiKeyResult | null> {
        if (!rawKey || typeof rawKey !== "string") {
            return null;
        }

        const keyHash = hashApiKey(rawKey);

        const apiKeyRecord = await prisma.apiKey.findUnique({
            where: { keyHash },
            include: {
                user: true,
                workspace: true,
            },
        });

        if (!apiKeyRecord) {
            return null;
        }

        // Check if expired
        if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
            return null;
        }

        // Asynchronously update lastUsedAt without blocking
        prisma.apiKey
            .update({
                where: { id: apiKeyRecord.id },
                data: { lastUsedAt: new Date() },
            })
            .catch((err) => console.error("Failed to update apiKey lastUsedAt:", err));

        return {
            apiKey: apiKeyRecord,
            user: apiKeyRecord.user,
            workspace: apiKeyRecord.workspace,
        };
    }
}
