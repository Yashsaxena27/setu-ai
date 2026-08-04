import { Request, Response } from "express";
import FamilyMember from "../models/FamilyMember";
import HouseholdAnalysis from "../models/HouseholdAnalysis";
import { analyzeHouseholdInternal } from "../services/HouseholdAnalysisService";

export const getFamilyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const members = await FamilyMember.find({ user_id: userId });
    const analysis = await HouseholdAnalysis.findOne({ user_id: userId });

    res.json({
      success: true,
      members,
      overview: {
        totalMembers: members.length,
        eligibleSchemes: analysis ? analysis.member_analyses.reduce((acc, curr) => acc + (curr.eligible_schemes.length || 0), 0) : 0,
        combinedBenefits: analysis ? analysis.combined_benefits : 0,
        applicationsReady: members.length > 0 ? Math.round(members.length * 1.2) : 0, // Mock indicators
        pendingDocuments: members.length > 0 ? members.length + 1 : 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addFamilyMember = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const member = new FamilyMember({
      ...req.body,
      user_id: userId,
    });
    await member.save();

    // Trigger analysis update in background
    await analyzeHouseholdInternal(userId);

    res.status(201).json({
      success: true,
      member,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateFamilyMember = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const member = await FamilyMember.findOneAndUpdate(
      { _id: id, user_id: userId },
      req.body,
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ success: false, message: "Family member not found" });
    }

    // Trigger analysis update
    await analyzeHouseholdInternal(userId);

    res.json({
      success: true,
      member,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteFamilyMember = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const member = await FamilyMember.findOneAndDelete({ _id: id, user_id: userId });
    if (!member) {
      return res.status(404).json({ success: false, message: "Family member not found" });
    }

    // Recalculate analysis
    await analyzeHouseholdInternal(userId);

    res.json({
      success: true,
      message: "Family member removed",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getHouseholdAnalysis = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const result = await analyzeHouseholdInternal(userId);

    res.json({
      success: true,
      analysis: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
