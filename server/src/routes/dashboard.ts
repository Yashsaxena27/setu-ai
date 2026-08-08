import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import { getDashboardSummary } from "../controllers/dashboardController";

const router = Router();

router.get("/summary", authMiddleware, getDashboardSummary);

export default router;
