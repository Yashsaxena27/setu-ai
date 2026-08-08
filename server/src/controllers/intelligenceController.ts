import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Scheme from "../models/Scheme";
import User from "../models/user";
import UserApplication from "../models/UserApplication";
import { NextBestActionService } from "../services/NextBestActionService";
import { DeadlineIntelligenceService } from "../services/DeadlineIntelligenceService";
import { NonMatchAnalysisService } from "../services/NonMatchAnalysisService";
import { PortfolioOptimizerService } from "../services/PortfolioOptimizerService";
import { findMatchingSchemes } from "../services/matchingService";
import { aiOrchestrator } from "../services/AIOrchestratorService";
import { sanitizeForPrompt } from "../utils/promptSanitizer";

export const getNextBestAction = async (req: AuthRequest, res: Response) => {
  try {
    const { schemeId, missingDocs } = req.body;
    const user = await User.findById(req.userId).lean();
    const scheme = schemeId ? await Scheme.findById(schemeId).lean() : null;
    let applicationState = null;
    
    if (schemeId) {
      applicationState = await UserApplication.findOne({ user_id: req.userId, scheme_id: schemeId }).lean();
    }

    const nba = NextBestActionService.getNextBestAction(user, scheme, applicationState, missingDocs);
    res.json(nba);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate next best action" });
  }
};

export const getDeadlineIntelligence = async (req: AuthRequest, res: Response) => {
  try {
    const { schemeId } = req.params;
    const scheme = await Scheme.findById(schemeId).lean();
    if (!scheme) return res.status(404).json({ error: "Scheme not found" });

    const metadata = DeadlineIntelligenceService.evaluateDeadline(scheme);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate deadline" });
  }
};

export const getWhyNot = async (req: AuthRequest, res: Response) => {
  try {
    const { schemeId } = req.params;
    const user = await User.findById(req.userId).lean();
    const scheme = await Scheme.findById(schemeId).lean();
    if (!scheme) return res.status(404).json({ error: "Scheme not found" });

    const reasons = NonMatchAnalysisService.analyzeNonMatch(user, scheme);
    res.json({ reasons });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate why not" });
  }
};

export const getPortfolioPlan = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).lean();
    const matches = await findMatchingSchemes(user);
    const plan = PortfolioOptimizerService.optimizePortfolio(matches);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate portfolio plan" });
  }
};

export const explainPortfolio = async (req: AuthRequest, res: Response) => {
  try {
    const { plan, mode } = req.body; // mode: 'official' | 'simple'
    const user = await User.findById(req.userId).lean();
    
    const promptBuilder = () => `
You are an expert government welfare planner.
Explain this recommended welfare sequence to the citizen.

Mode: ${mode === 'simple' ? 'Simple Plain Language (Hinglish/English)' : 'Formal Official Government Language'}
Household Profile: ${sanitizeForPrompt(user)}
Portfolio Sequence: ${sanitizeForPrompt(plan.sequence)}
Conflicts: ${sanitizeForPrompt(plan.conflicts)}
Dependencies: ${sanitizeForPrompt(plan.dependencies)}

Explain why this order is recommended. Keep it under 4 sentences.
    `;

    const result = await aiOrchestrator.request({
      taskType: "portfolio-explainer", 
      profile: user, 
      schemeId: "general", 
      promptBuilderFn: promptBuilder
    });
    res.json({ explanation: result });
  } catch (error) {
    res.status(500).json({ error: "Failed to explain portfolio" });
  }
};
