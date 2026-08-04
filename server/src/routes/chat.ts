import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  getSessions,
  getMessages,
  sendMessage,
  deleteSession,
} from "../controllers/chatController";

const router = Router();

router.get("/sessions", authMiddleware, getSessions);
router.get("/messages/:sessionId", authMiddleware, getMessages);
router.post("/message", authMiddleware, sendMessage);
router.delete("/session/:sessionId", authMiddleware, deleteSession);

export default router;
