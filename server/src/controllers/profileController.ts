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
    const updated = await User.findByIdAndUpdate(
      req.userId,
      req.body,
      {
        new: true,
      }
    ).select("-password");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
};