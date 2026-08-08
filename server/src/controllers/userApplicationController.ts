import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import UserApplication from "../models/UserApplication";
import Scheme from "../models/Scheme";
import User from "../models/user";
import { GovernmentStatusAdapter } from "../services/GovernmentStatusAdapter";
import { aiOrchestrator } from "../services/AIOrchestratorService";
import { sanitizeForPrompt } from "../utils/promptSanitizer";
import { DeadlineIntelligenceService } from "../services/DeadlineIntelligenceService";

export const getApplications = async (req: AuthRequest, res: Response) => {
  try {
    const apps = await UserApplication.find({ user_id: req.userId }).sort({ last_updated: -1 });
    res.json({ applications: apps });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { schemeId, status, current_stage, next_action, pending_documents, reference_number, rejection_reason } = req.body;
    
    const scheme = await Scheme.findById(schemeId);
    if (!scheme) return res.status(404).json({ error: "Scheme not found" });

    const updatedApp = await GovernmentStatusAdapter.updateApplicationStatus({
      userId: req.userId!,
      schemeId,
      schemeName: scheme.scheme_name!,
      status,
      current_stage,
      next_action,
      pending_documents,
      reference_number,
      rejection_reason,
      source: "manual",
    });

    res.json({ success: true, application: updatedApp });
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

export const getRejectionRecovery = async (req: AuthRequest, res: Response) => {
  try {
    const { schemeId } = req.body;
    const user = await User.findById(req.userId).lean();
    const app = await UserApplication.findOne({ user_id: req.userId, scheme_id: schemeId }).lean();
    const scheme = await Scheme.findById(schemeId).lean();

    if (!app || app.status !== "Rejected") {
      return res.status(400).json({ error: "Application is not in Rejected state." });
    }

    if (app.grievance_draft) {
      // return cached draft if exists
      return res.json({
         explanation: "Application was rejected based on provided reason.",
         corrective_actions: ["Submit grievance"],
         missing_info: "None",
         grievance_draft: app.grievance_draft,
         contact_info: "Refer to official scheme portal."
      });
    }
    
    const rejectionReason = app.rejection_reason || "Rejection reason not specified by authority.";
    
    const promptBuilder = () => `
You are an expert government welfare case officer.
The user's application was REJECTED. Help them recover.

Rejection Reason: ${rejectionReason}
User Profile: ${sanitizeForPrompt(user)}

Generate a structured JSON response (No markdown):
{
  "explanation": "Plain language explanation of why it was rejected.",
  "corrective_actions": ["Action 1", "Action 2"],
  "missing_info": "Any missing or incorrect information identified",
  "grievance_draft": "A formal, polite 3-sentence draft grievance/appeal letter they can submit.",
  "contact_info": "Where to submit the grievance (e.g. Nodal officer or Portal)"
}
    `;

    const result = await aiOrchestrator.request({
      taskType: "rejection-recovery", 
      profile: user, 
      schemeId, 
      promptBuilderFn: promptBuilder
    });

    if (result && result.grievance_draft) {
       await UserApplication.findByIdAndUpdate(app._id, { grievance_draft: result.grievance_draft });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate recovery plan" });
  }
};
