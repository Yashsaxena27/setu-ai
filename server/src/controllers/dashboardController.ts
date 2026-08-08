import { Request, Response } from "express";
import Match from "../models/Match";
import ApplicationScore from "../models/ApplicationScore";
import HouseholdAnalysis from "../models/HouseholdAnalysis";
import Scheme from "../models/Scheme";
import { parseBenefitValue } from "../services/HouseholdAnalysisService";

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1. Get total matches (unique schemes)
    const matches = await Match.find({ user_id: userId }).distinct("scheme_id");
    const matchedCount = matches.length;

    // 2. Get applications started (where score > 0 or roadmap steps modified)
    // For simplicity, we count any ApplicationScore record as an application started
    const scores = await ApplicationScore.find({ user_id: userId });
    const startedCount = scores.length;
    
    // Drafts generated
    const draftsCount = scores.filter(s => s.draft_score > 0).length;

    // 3. Document Readiness (we can estimate based on document_score > 50)
    const docsReadyCount = scores.filter(s => s.document_score > 50).length;

    // 4. Calculate total potential benefit from unique matched schemes
    const matchedSchemes = await Scheme.find({ _id: { $in: matches } });
    let totalPotential = 0;
    matchedSchemes.forEach(s => {
      const valStr = s.benefits?.[0] || "";
      totalPotential += parseBenefitValue(valStr);
    });

    // Add household benefits if they exist
    const household = await HouseholdAnalysis.findOne({ user_id: userId });
    if (household && household.combined_benefits > 0) {
      // Use household potential if it's larger (which it usually is)
      totalPotential = Math.max(totalPotential, household.combined_benefits);
    }

    // 5. Calculate "Already Pursuing" benefit (from started applications)
    const pursuingSchemes = await Scheme.find({ _id: { $in: scores.map(s => s.scheme_id) } });
    let alreadyPursuing = 0;
    pursuingSchemes.forEach(s => {
      const valStr = s.benefits?.[0] || "";
      alreadyPursuing += parseBenefitValue(valStr);
    });

    const unclaimed = Math.max(0, totalPotential - alreadyPursuing);

    res.json({
      success: true,
      summary: {
        matchedCount,
        startedCount,
        draftsCount,
        docsReadyCount,
        potentialBenefit: totalPotential,
        alreadyPursuing,
        unclaimedBenefit: unclaimed,
      }
    });

  } catch (error: any) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
