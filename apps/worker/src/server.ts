import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.resolve(process.cwd(), "../../.env"),
});

import "./workers/ingestion.worker";

console.log("Worker is running...");
console.log(process.env.HF_TOKEN);