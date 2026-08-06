import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import User from "../models/user";

export const verifyAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const allowedRoles = [
      "Moderator",
      "Scheme Editor",
      "District Admin",
      "State Admin",
      "Super Admin",
    ];

    if (!user.role || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Attach user to req
    (req as any).user = {
      ...(req as any).user,
      ...user.toObject(),
      role: user.role,
    };

    next();
  } catch (err) {
    console.error("Admin verification middleware error:", err);
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
};
