import { Router } from "express";
import { ApiKeysController } from "./api-keys.controller";

const router = Router();
const controller = new ApiKeysController();

router.post("/", controller.create);
router.get("/", controller.getAll);
router.delete("/:id", controller.delete);

export default router;
