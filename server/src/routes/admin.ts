import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
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

router.get("/dashboard", authMiddleware, getDashboardStats);
router.get("/analytics", authMiddleware, getWelfareAnalytics);
router.get("/users", authMiddleware, getAdminUsersList);
router.post("/notifications", authMiddleware, createAdminNotification);
router.get("/reports", authMiddleware, getAdminReportsList);

// CRUD Schemes
router.post("/schemes", authMiddleware, createSchemeAdmin);
router.put("/schemes/:id", authMiddleware, updateSchemeAdmin);
router.delete("/schemes/:id", authMiddleware, deleteSchemeAdmin);

export default router;
