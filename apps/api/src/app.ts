import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.resolve(process.cwd(), "../../.env"),
});

console.log(process.env.HF_TOKEN);
console.log(process.env.GROQ_KEY);

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
});

export default app;