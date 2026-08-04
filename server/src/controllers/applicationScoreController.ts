import { Request, Response } from "express";
import Scheme from "../models/Scheme";
import User from "../models/user";
import DocumentVerification from "../models/DocumentVerification";
import ApplicationScore from "../models/ApplicationScore";
import {
  calculateEligibilityScore,
  calculateDocumentScore,
  calculateProfileScore,
  calculateVerificationScore,
  calculateDraftScore,
  calculateOverallScore,
  generateRecommendations,
  generateRiskFlags,
  calculateTimeline,
  getReadinessJourney,
  DEFAULT_WEIGHTS,
} from "../services/ApplicationScoringService";
import { generateWhySuccessScore } from "../services/aiExplanationService";

async function recalculateScoreInternal(userId: string, schemeId: string) {
  const scheme = await Scheme.findById(schemeId);
  if (!scheme) throw new Error("Scheme not found");

  const profile = await User.findById(userId);
  if (!profile) throw new Error("User profile not found");

  // Fetch document uploads for user & scheme
  const uploads = await DocumentVerification.find({ user_id: userId, scheme_id: schemeId });
  const uploadedTypes = uploads.map((u) => u.document_type || "");
  const requiredDocs = scheme.required_documents || [];

  // 1. Calculate subscores
  const eligibility = calculateEligibilityScore(profile, scheme);
  const document = calculateDocumentScore(uploadedTypes, requiredDocs);
  const profileScore = calculateProfileScore(profile);
  const verification = calculateVerificationScore(uploads);
  const draft = await calculateDraftScore(userId, schemeId);

  // 2. Calculate overall score
  const overall = calculateOverallScore(eligibility, document, profileScore, verification, draft);

  // 3. Generate recommendations and risk flags
  const recommendations = generateRecommendations(profile, scheme, uploads, requiredDocs, DEFAULT_WEIGHTS, {
    eligibility,
    document,
    profile: profileScore,
    verification,
    draft,
  });

  const riskFlags = generateRiskFlags(uploads, profile);

  // 4. Update MongoDB snapshot history
  const latest = await ApplicationScore.findOne({ user_id: userId, scheme_id: schemeId }).sort({ createdAt: -1 });

  let scoreRecord: any;
  if (latest && latest.overall_score === overall) {
    latest.eligibility_score = eligibility;
    latest.document_score = document;
    latest.profile_score = profileScore;
    latest.verification_score = verification;
    latest.draft_score = draft;
    latest.recommendations = recommendations as any;
    latest.risk_flags = riskFlags;
    scoreRecord = await latest.save();
  } else {
    scoreRecord = new ApplicationScore({
      user_id: userId,
      scheme_id: schemeId,
      overall_score: overall,
      eligibility_score: eligibility,
      document_score: document,
      profile_score: profileScore,
      verification_score: verification,
      draft_score: draft,
      recommendations: recommendations as any,
      risk_flags: riskFlags,
    });
    await scoreRecord.save();
  }

  // 5. Generate AI Explanation
  let aiExplanation = "";
  try {
    aiExplanation = await generateWhySuccessScore(
      profile,
      scheme,
      { eligibility, document, profile: profileScore, verification, draft },
      overall,
      recommendations,
      riskFlags
    );
  } catch (e) {
    console.error("AI explanation failed for success score:", e);
    aiExplanation = `Your eligibility matches the requirements. However, missing or unverified documents affect your readiness score. Complete the checklist recommendations to maximize probability of approval.`;
  }

  // 6. Extra UI helpers
  const timeline = calculateTimeline(overall);
  const journey = getReadinessJourney(
    { eligibility, document, profile: profileScore, verification, draft },
    overall
  );

  return {
    ...scoreRecord.toObject ? scoreRecord.toObject() : scoreRecord,
    aiExplanation,
    timeline,
    journey,
    weights: DEFAULT_WEIGHTS,
  };
}

export const getScore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { schemeId } = req.params;
    if (!userId || !schemeId) {
      return res.status(400).json({
        success: false,
        message: "Missing parameter details",
      });
    }

    const result = await recalculateScoreInternal(userId as string, schemeId as string);

    res.json({
      success: true,
      score: result,
    });
  } catch (err: any) {
    console.error("Get score error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve application success score",
    });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { schemeId } = req.query;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const query: any = { user_id: userId };
    if (schemeId) {
      query.scheme_id = String(schemeId);
    }

    const history = await ApplicationScore.find(query).sort({ createdAt: 1 });

    res.json({
      success: true,
      history,
    });
  } catch (err: any) {
    console.error("Get history error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve scores history",
    });
  }
};

export const recalculateScore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { schemeId } = req.body;
    if (!userId || !schemeId) {
      return res.status(400).json({
        success: false,
        message: "Missing schemeId in body",
      });
    }

    const result = await recalculateScoreInternal(userId as string, schemeId as string);

    res.json({
      success: true,
      score: result,
    });
  } catch (err: any) {
    console.error("Recalculate score error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to recalculate score",
    });
  }
};
