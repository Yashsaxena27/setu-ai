import express from "express";
import { reportCorrection, getCorrectionReports, updateCorrectionStatus, getSchemeCorrections } from "../controllers/correctionController";
import authMiddleware from "../middleware/authMiddleware";
import { verifyAdmin } from "../middleware/adminMiddleware";

const router = express.Router();

router.post("/report", authMiddleware, reportCorrection);
router.get("/scheme/:schemeId", getSchemeCorrections);
router.get("/", authMiddleware, verifyAdmin, getCorrectionReports);
router.patch("/:id/status", authMiddleware, verifyAdmin, updateCorrectionStatus);

export default router;
