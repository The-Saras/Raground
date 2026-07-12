import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.resolve(process.cwd(), "../../.env"),
});

console.log(process.env.HF_TOKEN);

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import routes from "./routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", routes);
app.listen(3000, () => {
    console.log(`🚀 API running on http://localhost:${3000}`);
});

export default app;