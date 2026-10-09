import { IEmbeddingProvider } from "../interfaces/embeding.provider";
import { LocalEmbeddingProvider } from "./local-embedding.provider";
import "dotenv/config";

const localProvider = new LocalEmbeddingProvider();

export class HuggingFaceEmbeddingProvider implements IEmbeddingProvider {
    async embed(text: string): Promise<number[]> {
        // If HF_TOKEN is missing or explicitly using local mode, use LocalEmbeddingProvider
        if (!process.env.HF_TOKEN) {
            return localProvider.embed(text);
        }

        try {
            const response = await fetch(
                "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.HF_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        inputs: text,
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && Array.isArray(data[0])) {
                    return data[0];
                }
                if (Array.isArray(data) && typeof data[0] === "number") {
                    return data;
                }
            }

            // If HF returned 402 (no credits) or other API error, fall back to local provider
            console.warn(
                `HF API returned status ${response.status}. Automatically falling back to local @xenova/transformers embeddings.`
            );
            return localProvider.embed(text);
        } catch (error) {
            console.warn(
                "HF API request failed. Automatically falling back to local @xenova/transformers embeddings.",
                error
            );
            return localProvider.embed(text);
        }
    }
}