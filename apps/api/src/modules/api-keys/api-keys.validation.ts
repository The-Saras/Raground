import { z } from "zod";

export const createApiKeySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
    workspaceId: z.string().optional().nullable(),
    expiresInDays: z.number().int().positive("Expires in days must be a positive integer").optional().nullable(),
});
