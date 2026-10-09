export interface CreateApiKeyDto {
    name: string;
    workspaceId?: string | null;
    expiresInDays?: number | null;
}

export interface ApiKeyResponseDto {
    id: string;
    name: string;
    keyPreview: string;
    rawKey?: string;
    workspaceId: string | null;
    workspace?: {
        id: string;
        name: string;
    } | null;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
