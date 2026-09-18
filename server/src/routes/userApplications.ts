import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  getApplications,
  updateApplicationStatus,
  getRejectionRecovery
} from "../controllers/userApplicationController";
import { 
  prepareApplication, 
  getApplication, 
  getApplicationForScheme,
  startApplication,
  updateAppStatus,
  getApplicationEvents
} from "../controllers/applicationPrepareController";

const router = Router();

router.use(authMiddleware);

router.get("/", getApplications);
router.post("/status", updateApplicationStatus);
router.post("/rejection-recovery", getRejectionRecovery);
router.post("/prepare", prepareApplication);
router.get("/detail/:id", getApplication);
router.get("/for-scheme/:schemeId", getApplicationForScheme);

router.post("/:id/start", startApplication);
router.post("/:id/status", updateAppStatus);
router.get("/:id/events", getApplicationEvents);

export default router;
