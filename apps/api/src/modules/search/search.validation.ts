import { z } from "zod";

export const searchSchema = z.object({
    query: z.string().min(1, "Query is required"),
});

export type SearchInput = z.infer<typeof searchSchema>;
