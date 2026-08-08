import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  getApplications,
  updateApplicationStatus,
  getRejectionRecovery
} from "../controllers/userApplicationController";

const router = Router();

router.use(authMiddleware);

router.get("/", getApplications);
router.post("/status", updateApplicationStatus);
router.post("/rejection-recovery", getRejectionRecovery);

export default router;
