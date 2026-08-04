import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  getRoadmap,
  completeStep,
  getHistory,
  sendWhatsAppSummary,
} from "../controllers/applicationRoadmapController";

const router = Router();

router.get("/history", authMiddleware, getHistory);
router.post("/complete-step", authMiddleware, completeStep);
router.post("/whatsapp", authMiddleware, sendWhatsAppSummary);
router.get("/:schemeId", authMiddleware, getRoadmap);

export default router;
