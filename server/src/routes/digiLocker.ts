import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  connectDigiLocker,
  getDigiLockerDocuments,
  importDigiLockerDocument,
} from "../controllers/digiLockerController";

const router = Router();

router.post("/connect", authMiddleware, connectDigiLocker);
router.get("/documents", authMiddleware, getDigiLockerDocuments);
router.post("/import", authMiddleware, importDigiLockerDocument);

export default router;
