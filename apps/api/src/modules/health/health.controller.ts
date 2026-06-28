import { Request, Response } from "express";

export class HealthController {
    getHealth(_req: Request, res: Response) {
        res.status(200).json({
            status: "ok",
            service: "raground-api",
        });
    }
}