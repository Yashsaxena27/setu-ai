import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import { aiLimiter } from "../middleware/rateLimiter";
import {
  uploadDocument,
  analyzeDocument,
  getDocumentsHistory,
  getDocumentsReadiness,
  deleteDocument,
} from "../controllers/documentsController";

const router = Router();

router.post("/upload", authMiddleware, aiLimiter, uploadDocument);
router.post("/analyze", authMiddleware, aiLimiter, analyzeDocument);
router.get("/history", authMiddleware, getDocumentsHistory);
router.get("/readiness", authMiddleware, getDocumentsReadiness);
router.delete("/:id", authMiddleware, deleteDocument);

export default router;
