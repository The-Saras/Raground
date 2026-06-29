import { z } from "zod";

export const createWorkspaceSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;