import { z } from "zod";

export const chatSchema = z.object({
    query: z.string().min(1, "Query is required"),
});