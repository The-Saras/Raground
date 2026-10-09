import { IEmbeddingProvider } from "../interfaces/embeding.provider";

let pipelinePromise: Promise<any> | null = null;

async function getExtractor() {
    if (!pipelinePromise) {
        pipelinePromise = (async () => {
            const { pipeline } = await import("@xenova/transformers");
            return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        })();
    }
    return pipelinePromise;
}

export class LocalEmbeddingProvider implements IEmbeddingProvider {
    async embed(text: string): Promise<number[]> {
        const extractor = await getExtractor();
        const output = await extractor(text, {
            pooling: "mean",
            normalize: true,
        });
        return Array.from(output.data);
    }
}
