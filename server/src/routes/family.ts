import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  getFamilyProfile,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  getHouseholdAnalysis,
} from "../controllers/familyController";

const router = Router();

router.get("/", authMiddleware, getFamilyProfile);
router.post("/member", authMiddleware, addFamilyMember);
router.put("/member/:id", authMiddleware, updateFamilyMember);
router.delete("/member/:id", authMiddleware, deleteFamilyMember);
router.get("/analysis", authMiddleware, getHouseholdAnalysis);

export default router;
