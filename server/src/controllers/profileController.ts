import { Response } from "express";
import User from "../models/user";
import { AuthRequest } from "../middleware/authMiddleware";

export const getProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // Prevent unauthorized role privilege escalation via profile update
    const updateData = { ...req.body };
    delete updateData.role;
    delete updateData.password;
    delete updateData._id;

    const updated = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      {
        new: true,
      }
    ).select("-password");

    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};