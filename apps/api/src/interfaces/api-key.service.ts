import { ApiKey, User, Workspace } from "@prisma/client";
import { CreateApiKeyDto, ApiKeyResponseDto } from "../modules/api-keys/api-keys.types";

export interface ValidatedApiKeyResult {
    apiKey: ApiKey;
    user: User;
    workspace: Workspace | null;
}

export interface IApiKeyService {
    create(
        userId: string,
        data: CreateApiKeyDto
    ): Promise<{ apiKey: ApiKeyResponseDto; rawKey: string }>;

    getAll(userId: string): Promise<ApiKeyResponseDto[]>;
    getById(userId: string, id: string): Promise<ApiKeyResponseDto | null>;
    delete(userId: string, id: string): Promise<boolean>;
    validateKey(rawKey: string): Promise<ValidatedApiKeyResult | null>;
}
