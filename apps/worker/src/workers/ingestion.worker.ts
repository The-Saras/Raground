import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { redisConfig } from "../config/redis";

const prisma = new PrismaClient();

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

        console.log(ingestionJob.dataSource.content);


    },
    {
        connection: redisConfig,
    }
);