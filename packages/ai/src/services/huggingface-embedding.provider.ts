import { IEmbeddingProvider } from "../interfaces/embeding.provider";
import "dotenv/config";

export class HuggingFaceEmbeddingProvider implements IEmbeddingProvider {
    async embed(text: string): Promise<number[]> {
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

        const raw = await response.text();

        let data;

        try {
            data = JSON.parse(raw);
        } catch {
            throw new Error(
                `HF returned non-JSON (${response.status}): ${raw.slice(0, 200)}`
            );
        }

        if (!response.ok) {
            throw new Error(
                `HF API error ${response.status}: ${JSON.stringify(data)}`
            );
        }

        if (Array.isArray(data) && Array.isArray(data[0])) {
            return data[0];
        }

        if (Array.isArray(data) && typeof data[0] === "number") {
            return data;
        }

        throw new Error(
            `Unexpected embedding format: ${JSON.stringify(data).slice(0, 200)}`
        );
    }
}