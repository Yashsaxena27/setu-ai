import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  getScore,
  getHistory,
  recalculateScore,
} from "../controllers/applicationScoreController";

const router = Router();

router.get("/history", authMiddleware, getHistory);
router.post("/recalculate", authMiddleware, recalculateScore);
router.get("/:schemeId", authMiddleware, getScore);

export default router;
