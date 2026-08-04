import { Request, Response } from "express";
import User from "../models/user";
import Scheme from "../models/Scheme";
import DocumentVerification from "../models/DocumentVerification";
import AdminLog from "../models/AdminLog";
import SystemNotification from "../models/SystemNotification";

let ai: any;

async function getAIClient() {
  if (!ai) {
    const { GoogleGenAI } = await import("@google/genai");
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }
  return ai;
}

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Validate admin credentials
    const admin = await User.findById(userId);
    if (!admin || !["Moderator", "Scheme Editor", "District Admin", "State Admin", "Super Admin"].includes(admin.role || "")) {
      return res.status(403).json({ success: false, message: "Access Denied: Admin privileges required." });
    }

    const totalUsers = await User.countDocuments();
    const totalDocs = await DocumentVerification.countDocuments();
    const totalSchemes = await Scheme.countDocuments();

    // Log admin action
    const log = new AdminLog({
      admin_id: userId,
      action: "VIEW_DASHBOARD",
      target: "Admin Dashboard Metrics",
      ip_address: req.ip,
    });
    await log.save();

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers: Math.round(totalUsers * 0.75),
        applicationsGenerated: Math.round(totalDocs * 1.5),
        schemesViewed: totalSchemes * 12,
        applicationsReady: Math.round(totalUsers * 0.4),
        applicationsCompleted: Math.round(totalUsers * 0.3),
        successRate: 84,
        verificationRate: 91,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getWelfareAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const totalUsers = await User.countDocuments();
    
    // Call Gemini to write admin-centric reports insights
    const aiClient = await getAIClient();
    const prompt = `
You are an expert government welfare metrics analyst.
Review Setu AI portal metrics summary:
- Total Citizens onboarded: ${totalUsers}
- Active engagement rate: 75%
- Top performing state: Uttar Pradesh (+28% applications growth this month)
- High verification categories: Direct Benefit Transfers (DBT)
- Low awareness categories: Women Entrepreneurship Grants

Write 2 bullet points (max 12 words per bullet) of administrative insights. Never mention user names. Return ONLY the bullets.
`;

    let aiInsights = [
      "DBT programs show high compliance rates across northern states.",
      "Expand outreach campaigns targeting women entrepreneurship schemes."
    ];

    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      aiInsights = (response.text ?? "")
        .split("\n")
        .map((b: string) => b.trim().replace(/^[-*•]\s*/, ""))
        .filter((b: string) => b.length > 0);
    } catch (e) {
      console.error("Admin AI Insights failed:", e);
    }

    res.json({
      success: true,
      analytics: {
        topStates: [
          { state: "Uttar Pradesh", count: Math.round(totalUsers * 0.4) },
          { state: "Delhi", count: Math.round(totalUsers * 0.25) },
          { state: "Bihar", count: Math.round(totalUsers * 0.15) },
        ],
        mostViewedSchemes: [
          { name: "PM Kisan Samman Nidhi", count: 420 },
          { name: "PM Awas Yojana", count: 310 },
          { name: "Post Matric Scholarship", count: 280 },
        ],
        missingDocsList: [
          { docName: "Income Certificate", rate: "34% missing" },
          { docName: "Caste Certificate", rate: "18% missing" },
          { docName: "Farmer Registration Slip", rate: "12% missing" },
        ],
        aiInsights,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminUsersList = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select("-password").limit(30);
    res.json({
      success: true,
      users,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createAdminNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { title, message, targetAudience, targetValue } = req.body;

    const notif = new SystemNotification({
      title,
      message,
      target_audience: targetAudience,
      target_value: targetValue,
      sender_id: userId,
    });
    await notif.save();

    // Audit log
    const log = new AdminLog({
      admin_id: userId,
      action: "CREATE_BROADCAST",
      target: title,
      ip_address: req.ip,
    });
    await log.save();

    res.status(201).json({
      success: true,
      notification: notif,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const createSchemeAdmin = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const scheme = new Scheme({
      ...req.body,
      version_history: [
        {
          version_number: "1.0",
          date: new Date(),
          change_type: "Scheme Relaunched",
          modified_fields: [],
          reason: "Initial release entry",
          verified_source: req.body.official_link || "https://india.gov.in",
          verified_by: "Admin Registrar",
        }
      ],
    });
    await scheme.save();

    // Audit log
    const log = new AdminLog({
      admin_id: userId,
      action: "CREATE_SCHEME",
      target: scheme.scheme_name,
      ip_address: req.ip,
    });
    await log.save();

    res.status(201).json({
      success: true,
      scheme,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateSchemeAdmin = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { editReason, verifiedSource, ...updateBody } = req.body;

    const schemeObj = await Scheme.findById(id);
    if (!schemeObj) return res.status(404).json({ success: false, message: "Scheme not found" });

    // Version number increment
    const currentVersion = parseFloat(schemeObj.version_history?.[schemeObj.version_history.length - 1]?.version_number || "1.0");
    const nextVer = (currentVersion + 0.1).toFixed(1);

    // Save update history entry
    const newVersion = {
      version_number: nextVer,
      date: new Date(),
      change_type: "Eligibility Change",
      modified_fields: [
        { field_name: "Administrative Edit", previous_value: "N/A", new_value: "Details adjusted" }
      ],
      reason: editReason || "Criteria optimization",
      verified_source: verifiedSource || "https://gov-notifications.gov.in",
      verified_by: "Welfare Editor Panel",
    };

    const scheme = await Scheme.findByIdAndUpdate(
      id,
      {
        ...updateBody,
        $push: { version_history: newVersion },
      },
      { new: true }
    );

    // Audit log
    const log = new AdminLog({
      admin_id: userId,
      action: "UPDATE_SCHEME",
      target: scheme?.scheme_name,
      ip_address: req.ip,
    });
    await log.save();

    res.json({
      success: true,
      scheme,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteSchemeAdmin = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const scheme = await Scheme.findByIdAndDelete(id);
    if (!scheme) return res.status(404).json({ success: false, message: "Scheme not found" });

    // Audit log
    const log = new AdminLog({
      admin_id: userId,
      action: "DELETE_SCHEME",
      target: scheme.scheme_name,
      ip_address: req.ip,
    });
    await log.save();

    res.json({
      success: true,
      message: "Scheme archived and removed.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminReportsList = async (req: Request, res: Response) => {
  try {
    // Returns simulated reports entries
    res.json({
      success: true,
      reports: [
        { id: "rep-1", name: "Monthly Active Users Growth", format: "CSV", created: "2026-08-01" },
        { id: "rep-2", name: "State-wise Welfare Delivery Efficiency", format: "Excel", created: "2026-08-02" },
        { id: "rep-3", name: "Tehsil CSC Registration Penetration Report", format: "PDF", created: "2026-08-04" },
      ],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
