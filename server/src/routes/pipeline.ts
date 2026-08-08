import { Router } from "express";
import { triggerSync, getSyncLogs } from "../controllers/pipelineController";

const router = Router();

// In a real app, these should be protected by admin middleware
router.post("/sync", triggerSync);
router.get("/logs", getSyncLogs);

export default router;
