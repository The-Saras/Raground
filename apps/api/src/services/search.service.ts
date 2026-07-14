import { ISearchService } from "../interfaces/search.service"
import { SearchResult } from "../modules/search/search.types";
import { prisma } from "@raground/database";
import { HuggingFaceEmbeddingProvider } from "@raground/ai";

const emb = new HuggingFaceEmbeddingProvider();

export class SearchService implements ISearchService {
    async search(workspaceId: string, query: string, limit?: number): Promise<SearchResult[]> {
        const queryChunks = await emb.embed(query);

        const embeddingString = `[${queryChunks.join(",")}]`;
        const results = await prisma.$queryRaw<SearchResult[]>`
            SELECT
                c.id AS "chunkId",
                c.content,
                1 - (e.vector <=> ${embeddingString}::vector) AS score
            FROM "Chunk" c
            INNER JOIN "Embedding" e
                ON c.id = e."chunkId"
            INNER JOIN "DataSource" d
                ON c."dataSourceId" = d.id
            WHERE d."workspaceId" = ${workspaceId}
            ORDER BY e.vector <=> ${embeddingString}::vector
            LIMIT ${limit ?? 5};;
        `;
        return results;

    }
}