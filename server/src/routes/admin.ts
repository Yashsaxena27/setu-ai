import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import { verifyAdmin } from "../middleware/adminMiddleware";
import {
  getDashboardStats,
  getWelfareAnalytics,
  getAdminUsersList,
  createAdminNotification,
  createSchemeAdmin,
  updateSchemeAdmin,
  deleteSchemeAdmin,
  getAdminReportsList,
} from "../controllers/adminController";

const router = Router();

router.get("/dashboard", authMiddleware, verifyAdmin, getDashboardStats);
router.get("/analytics", authMiddleware, verifyAdmin, getWelfareAnalytics);
router.get("/users", authMiddleware, verifyAdmin, getAdminUsersList);
router.post("/notifications", authMiddleware, verifyAdmin, createAdminNotification);
router.get("/reports", authMiddleware, verifyAdmin, getAdminReportsList);

// CRUD Schemes
router.post("/schemes", authMiddleware, verifyAdmin, createSchemeAdmin);
router.put("/schemes/:id", authMiddleware, verifyAdmin, updateSchemeAdmin);
router.delete("/schemes/:id", authMiddleware, verifyAdmin, deleteSchemeAdmin);

export default router;
