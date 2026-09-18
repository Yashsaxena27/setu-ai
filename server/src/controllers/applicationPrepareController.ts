import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/user";
import Scheme from "../models/Scheme";
import UserApplication from "../models/UserApplication";
import DocumentVerification from "../models/DocumentVerification";
import { calculateEligibilityScore } from "../services/ApplicationScoringService";

export const prepareApplication = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { schemeId } = req.body;

    if (!userId || !schemeId) {
      return res.status(400).json({ success: false, message: "Missing userId or schemeId" });
    }

    const userProfile = await User.findById(userId);
    const scheme = await Scheme.findById(schemeId);

    if (!userProfile || !scheme) {
      return res.status(404).json({ success: false, message: "User or Scheme not found" });
    }

    const eligibilityScore = calculateEligibilityScore(userProfile, scheme);

    const uploads = await DocumentVerification.find({ user_id: userId, scheme_id: schemeId });

    const requiredDocs = scheme.required_documents || [];
    const documents = requiredDocs.map(reqDoc => {
      const match = uploads.find(u => 
        u.document_type?.toLowerCase().includes(reqDoc.toLowerCase()) || 
        reqDoc.toLowerCase().includes(u.document_type?.toLowerCase() || "")
      );
      
      let status = "missing";
      if (match) {
        status = match.validation_status === "Verified" ? "ready" : "unknown";
      }

      return {
        name: reqDoc,
        status,
        source: match ? "uploaded" : undefined
      };
    });

    const eligibilityPoints = eligibilityScore === 100 ? 20 : Math.round((eligibilityScore / 100) * 20);
    const docCount = requiredDocs.length;
    const readyCount = documents.filter(d => d.status === "ready").length;
    const docPoints = docCount > 0 ? Math.round((readyCount / docCount) * 40) : 40;
    
    const s = scheme as any;
    const routePoints = (s.applicationMethods?.length > 0 || s.official_link) ? 20 : 0;

    const existingApp = await UserApplication.findOne({ user_id: userId, scheme_id: schemeId });
    const draftPoints = existingApp?.generatedDraft ? 20 : 0;

    const readinessScore = Math.min(100, Math.max(0, eligibilityPoints + docPoints + routePoints + draftPoints));

    const applicantSnapshot = {
      name: userProfile.name,
      age: userProfile.age,
      gender: userProfile.gender,
      state: userProfile.state,
      district: userProfile.district,
      occupation: userProfile.occupation,
      income: userProfile.income,
      education: userProfile.education,
      phone: userProfile.phone
    };

    const schemeSnapshot = {
      scheme_name: s.scheme_name,
      category: s.category,
      level: s.level,
      benefits: s.benefits,
      required_documents: s.required_documents,
      application_steps: s.application_steps,
      official_link: s.official_link,
      applicationMethods: s.applicationMethods,
      applicationOffice: s.applicationOffice,
      bankRequired: s.bankRequired,
      bankPurpose: s.bankPurpose,
      applicationFee: s.applicationFee,
      processingTime: s.processingTime,
      last_verified_date: s.last_verified_date
    };

    const appStatus = readinessScore >= 80 ? 'Ready to Apply' : (readyCount < docCount ? 'Documents Pending' : 'Preparing');
    const nextAction = readinessScore >= 80 ? 'Submit Application' : 'Upload Missing Documents';

    const updateData = {
      user_id: userId,
      scheme_id: schemeId,
      scheme_name: s.scheme_name,
      status: appStatus,
      next_action: nextAction,
      readinessScore,
      documents,
      applicantSnapshot,
      schemeSnapshot,
      last_updated: new Date()
    };

    const application = await UserApplication.findOneAndUpdate(
      { user_id: userId, scheme_id: schemeId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    // Dynamic import to avoid circular dependency issues if any, or just use the model
    // But since ApplicationEvent is now imported at the bottom, we should import it at top
    // Wait, let's just use mongoose.model if not available or move import
    const EventModel = (mongoose.models.ApplicationEvent) || require("../models/ApplicationEvent").default;
    await EventModel.create({
      applicationId: application._id,
      type: "APPLICATION_PREPARED",
      source: "system"
    });

    res.json({ success: true, application });
  } catch (error) {
    console.error("Prepare application error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getApplication = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const applicationId = req.params.id;

    const application = await UserApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (application.user_id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    res.json({ success: true, application });
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getApplicationForScheme = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { schemeId } = req.params;

    const application = await UserApplication.findOne({ user_id: userId, scheme_id: schemeId });
    
    res.json({ success: true, application });
  } catch (error) {
    console.error("Get application for scheme error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

import ApplicationEvent from "../models/ApplicationEvent";

export const startApplication = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const applicationId = req.params.id;

    const application = await UserApplication.findById(applicationId);
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });
    if (application.user_id.toString() !== userId) return res.status(403).json({ success: false, message: "Unauthorized" });

    application.status = "Started";
    await application.save();

    await ApplicationEvent.create({
      applicationId: application._id,
      type: "APPLICATION_STARTED",
      source: "user"
    });

    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateAppStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const applicationId = req.params.id;
    const { status } = req.body;

    const application = await UserApplication.findById(applicationId);
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });
    if (application.user_id.toString() !== userId) return res.status(403).json({ success: false, message: "Unauthorized" });

    application.status = status;
    await application.save();

    await ApplicationEvent.create({
      applicationId: application._id,
      type: "STATUS_UPDATED",
      source: "user"
    });

    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getApplicationEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const applicationId = req.params.id;

    const application = await UserApplication.findById(applicationId);
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });
    if (application.user_id.toString() !== userId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const events = await ApplicationEvent.find({ applicationId }).sort({ timestamp: -1 });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
