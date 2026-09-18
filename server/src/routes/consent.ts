import { Router } from "express";
import authMiddleware, { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/user";

const router = Router();

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.consent_given = true;
    user.consent_timestamp = new Date();
    await user.save();
    res.json({ success: true, message: "Consent updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update consent" });
  }
});

export default router;
