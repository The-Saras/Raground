import { z } from "zod";

export const v1IngestSchema = z.object({
    title: z.string().max(200, "Title cannot exceed 200 characters").optional().nullable(),
    content: z.string().min(1, "Document content is required and cannot be empty"),
});

export const v1SearchSchema = z.object({
    query: z.string().min(1, "Search query is required"),
    limit: z.number().int().min(1).max(50).optional().default(5),
});

export const v1ChatSchema = z.object({
    query: z.string().min(1, "Chat query is required"),
    systemPrompt: z.string().optional().nullable(),
    topK: z.number().int().min(1).max(20).optional().default(5),
});
