import { Worker } from "bullmq";

import { redisConfig } from "../config/redis";

export const ingestionWorker = new Worker(
    "ingestion",
    async (job) => {
        console.log("Received Job");
        console.log(job.data.jobId);
    },
    {
        connection: redisConfig,
    }
);