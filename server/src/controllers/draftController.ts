import { Request, Response } from "express";
import { generateDraft } from "../services/draftService";
import ApplicationScore from "../models/ApplicationScore";

export async function createDraft(
  req: Request,
  res: Response
) {
  try {
    const draft = await generateDraft(
      req.body.profile,
      req.body.scheme
    );

    const userId = (req as any).user?.userId;
    const schemeId = req.body.scheme?._id;

    if (userId && schemeId) {
      const existing = await ApplicationScore.findOne({ user_id: userId, scheme_id: schemeId });
      if (existing) {
        existing.draft_score = 100;
        await existing.save();
      } else {
        const stubScore = new ApplicationScore({
          user_id: userId,
          scheme_id: schemeId,
          overall_score: 5,
          eligibility_score: 0,
          document_score: 0,
          profile_score: 0,
          verification_score: 100,
          draft_score: 100,
          recommendations: [],
          risk_flags: [],
        });
        await stubScore.save();
      }
    }

    res.json({
      success: true,
      draft,
      requiredDocuments:
        (req.body.scheme.required_documents || req.body.scheme.requiredDocuments) ?? [],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}