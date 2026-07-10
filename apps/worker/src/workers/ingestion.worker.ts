import dotenv from "dotenv";

import { Worker } from "bullmq";
import { prisma } from "@raground/database";
//import { PrismaClient } from "@prisma/client";
import { redisConfig } from "../config/redis";
import { RecursiveChunkStrategy } from "@raground/ai";
import { HuggingFaceEmbeddingProvider } from "@raground/ai";

//const prisma = new PrismaClient();

const chunkingStrategy = new RecursiveChunkStrategy();
const embedings_provider = new HuggingFaceEmbeddingProvider();

export const ingestionWorker = new Worker(
    "ingestion",
    async (job) => {
        console.log("Received Job");
        console.log(job.data.jobId);
        const ingestionJob = await prisma.job.findUnique({
            where: {
                id: job.data.jobId,
            },
            include: {
                dataSource: true
            }
        })

        if (!ingestionJob || !ingestionJob.dataSource) {
            return;
        }

        const chunks = chunkingStrategy.chunk(ingestionJob.dataSource.content);

        console.log(chunks);
        for (const [index, content] of chunks.entries()) {

            const createdChunk = await prisma.chunk.create({
                data: {
                    content,
                    chunkIndex: index,
                    dataSourceId: ingestionJob.dataSource.id,
                },
            });


            const embedding = await embedings_provider.embed(content);

            console.log(
                `Chunk ${index} -> Embedding Length: ${embedding.length}`
            );

            // Store Embedding
            await prisma.$executeRaw`
    INSERT INTO "Embedding"
        ("id", "provider", "model", "vector", "chunkId", "createdAt", "updatedAt")
    VALUES
        (
            ${crypto.randomUUID()},
            'huggingface',
            'sentence-transformers/all-MiniLM-L6-v2',
            ${embedding}::vector,
            ${createdChunk.id},
            NOW(),
            NOW()
        )
`;
        }

    },
    {
        connection: redisConfig,
    }
);