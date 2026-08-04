import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  getUpdatesFeed,
  getSchemeVersionHistory,
  triggerChangeCheck,
  getMyImpact,
} from "../controllers/schemeUpdatesController";

const router = Router();

router.get("/", authMiddleware, getUpdatesFeed);
router.get("/my-impact", authMiddleware, getMyImpact);
router.post("/check", authMiddleware, triggerChangeCheck);
router.get("/:schemeId", authMiddleware, getSchemeVersionHistory);

export default router;
