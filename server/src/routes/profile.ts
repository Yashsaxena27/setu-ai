import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  getProfile,
  updateProfile,
  recordLifeEvent
} from "../controllers/profileController";

const router = Router();

router.get("/", authMiddleware, getProfile);

router.put("/", authMiddleware, updateProfile);

router.post("/life-event", authMiddleware, recordLifeEvent);

export default router;