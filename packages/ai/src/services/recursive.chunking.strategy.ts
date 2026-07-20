import { PrismaClient, Prisma, Chunk } from "@prisma/client";
import { IChunkStrategy } from "../interfaces/chunking.strategy";


export class RecursiveChunkStrategy implements IChunkStrategy {
    private readonly chunkSize = 500;
    private readonly chunkOverlap = 100;

    chunk(text: string): string[] {
        const chunks: string[] = [];
        let start = 0;

        while (start < text.length) {
            const end = Math.min(start + this.chunkSize, text.length)

            chunks.push(text.slice(start, end));
            start += this.chunkSize - this.chunkOverlap
        }

        return chunks;

    }

}
