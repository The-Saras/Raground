import { z } from "zod";

export const createDataSourceSchema = z.object({
    title: z.string().optional(),
    content: z.string().min(1),
});