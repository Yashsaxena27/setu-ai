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

import { findMatchingSchemes } from "../services/matchingService";

export const recordLifeEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { event } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let updated = false;
    if (event === "college_enrollment") {
      user.occupation = "Student";
      updated = true;
    } else if (event === "marriage") {
      user.marital_status = "Married";
      updated = true;
    } else if (event === "job_loss") {
      user.occupation = "Unemployed";
      updated = true;
    }

    if (updated) {
      await user.save();
    }

    const newMatches = await findMatchingSchemes(user.toObject ? user.toObject() : user);
    res.json({ success: true, newMatches });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to record life event" });
  }
};