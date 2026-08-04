import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import { createDraft } from "../controllers/draftController";

const router = Router();

router.post("/", authMiddleware, createDraft);

export default router;