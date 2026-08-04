import { Request, Response } from "express";
import User from "../models/user";
import Scheme from "../models/Scheme";
import ApplicationRoadmap from "../models/ApplicationRoadmap";
import { generateRoadmapInternal, generateRoadmapAIAdvice } from "../services/RoadmapService";

export const getRoadmap = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { schemeId } = req.params;

    if (!userId || !schemeId) {
      return res.status(400).json({
        success: false,
        message: "Missing parameter details",
      });
    }

    const roadmap = await generateRoadmapInternal(userId as string, schemeId as string);
    
    // Fetch profile and scheme details to generate AI advice
    const profile = await User.findById(userId);
    const scheme = await Scheme.findById(schemeId);

    const advice = await generateRoadmapAIAdvice(
      profile,
      scheme,
      roadmap.steps,
      roadmap.successScore,
      roadmap.completion_percentage
    );

    res.json({
      success: true,
      roadmap: {
        ...roadmap,
        aiGuidance: advice,
      },
    });
  } catch (err: any) {
    console.error("Get roadmap error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve personalized roadmap",
    });
  }
};

export const completeStep = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { schemeId, stepId } = req.body;

    if (!userId || !schemeId || !stepId) {
      return res.status(400).json({
        success: false,
        message: "Missing schemeId or stepId parameters in request body",
      });
    }

    const roadmap = await ApplicationRoadmap.findOne({ user_id: userId, scheme_id: schemeId });
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Application roadmap not initialized",
      });
    }

    // Find the targeted step
    const step = roadmap.steps.find((s) => s.id === stepId);
    if (!step) {
      return res.status(404).json({
        success: false,
        message: "Roadmap step not found",
      });
    }

    if (step.status === "Locked") {
      return res.status(400).json({
        success: false,
        message: "This step is locked. Please complete previous prerequisite steps first.",
      });
    }

    // Mark completed
    step.status = "Completed";
    await roadmap.save();

    // Recalculate roadmap dependencies and status unlocks
    const updated = await generateRoadmapInternal(userId as string, schemeId as string);

    res.json({
      success: true,
      roadmap: updated,
    });
  } catch (err: any) {
    console.error("Complete step error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to complete roadmap step",
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

    const roadmaps = await ApplicationRoadmap.find(query).sort({ updatedAt: -1 });

    res.json({
      success: true,
      roadmaps,
    });
  } catch (err: any) {
    console.error("Get roadmap history error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to load roadmaps history",
    });
  }
};

export const sendWhatsAppSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { schemeId } = req.body;

    if (!userId || !schemeId) {
      return res.status(400).json({
        success: false,
        message: "Missing schemeId in body",
      });
    }

    const roadmap = await generateRoadmapInternal(userId as string, schemeId as string);
    const activeStep = roadmap.steps.find((s) => s.status !== "Completed") || roadmap.steps[roadmap.steps.length - 1];
    
    // Construct message string
    let message = `📍 *Setu AI - Personalized Application Roadmap*\n\n`;
    message += `Scheme: *${roadmap.schemeName}*\n`;
    message += `Progress: *${roadmap.completion_percentage}% Completed*\n`;
    message += `Success Score: *${roadmap.successScore}%*\n\n`;
    
    message += `📋 *Next Best Action*:\n`;
    message += `👉 *${activeStep.title}*\n`;
    message += `Est Time: ${activeStep.estimated_time} • Priority: ${activeStep.priority}\n\n`;

    const pending = roadmap.steps.filter((s) => s.status === "Pending");
    if (pending.length > 0) {
      message += `⏳ *Pending Tasks*:\n`;
      pending.forEach((s, idx) => {
        message += `${idx + 1}. ${s.title} (Priority: ${s.priority})\n`;
      });
      message += `\n`;
    }

    const schemeObj = await Scheme.findById(schemeId);
    if (schemeObj && schemeObj.official_link) {
      message += `🔗 *Official Application Portal*:\n`;
      message += `${schemeObj.official_link}\n`;
    }

    res.json({
      success: true,
      message,
      phone: "Simulated User Mobile Number",
    });
  } catch (err: any) {
    console.error("Send WhatsApp Roadmap error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to prepare WhatsApp dispatch summary",
    });
  }
};
