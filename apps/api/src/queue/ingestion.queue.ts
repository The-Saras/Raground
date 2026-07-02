import { Queue } from "bullmq";

const ingestionQueue = new Queue("ingestion", {
    connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,

    }
})

export default ingestionQueue;