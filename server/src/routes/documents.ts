import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  uploadDocument,
  analyzeDocument,
  getDocumentsHistory,
  getDocumentsReadiness,
  deleteDocument,
} from "../controllers/documentsController";

const router = Router();

router.post("/upload", authMiddleware, uploadDocument);
router.post("/analyze", authMiddleware, analyzeDocument);
router.get("/history", authMiddleware, getDocumentsHistory);
router.get("/readiness", authMiddleware, getDocumentsReadiness);
router.delete("/:id", authMiddleware, deleteDocument);

export default router;
