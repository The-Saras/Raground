import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { redisConfig } from "../config/redis";
import { RecursiveChunkStrategy } from "@raground/ai";

const prisma = new PrismaClient();

const chunkingStrategy = new RecursiveChunkStrategy();

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
        await prisma.chunk.createMany({
            data: chunks.map((content, index) => ({
                content,
                chunkIndex: index,
                dataSourceId: ingestionJob.dataSource.id,
            })),
        });



    },
    {
        connection: redisConfig,
    }
);