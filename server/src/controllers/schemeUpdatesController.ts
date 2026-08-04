import { Request, Response } from "express";
import Scheme from "../models/Scheme";
import SchemeUpdate from "../models/SchemeUpdate";
import User from "../models/user";
import DocumentVerification from "../models/DocumentVerification";
import { detectChanges, generateImpactAnalysis, notifyAffectedUsers } from "../services/SchemeUpdateService";
import { findMatchingSchemes } from "../services/matchingService";
import { formatMatchResponse } from "../services/matchResponseFormatter";

export const getUpdatesFeed = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { type } = req.query;

    const profile = await User.findById(userId);
    if (!profile) return res.status(404).json({ success: false, message: "User not found" });

    // Fetch matching schemes to determine "My Schemes" filter
    const matches = await findMatchingSchemes(profile);
    const matchedIds = matches.map((m) => m._id.toString());

    // Build DB query
    const query: any = {};
    if (type === "mine") {
      query.scheme_id = { $in: matchedIds };
    } else if (type === "critical") {
      query.change_type = { $in: ["Income Limit Change", "Eligibility Change", "Scheme Closed"] };
    } else if (type === "benefits") {
      query.change_type = "Benefit Increase";
    }

    const updates = await SchemeUpdate.find(query)
      .populate("scheme_id")
      .sort({ date: -1 })
      .limit(20);

    // Dynamic AI impact analysis for each update card
    const feed = await Promise.all(
      updates.map(async (u: any) => {
        if (!u.scheme_id) return null;
        
        let impact = "No direct impact detected";
        const isMatched = matchedIds.includes(u.scheme_id._id.toString());
        
        if (isMatched) {
          impact = await generateImpactAnalysis(u, profile, u.scheme_id.scheme_name);
        }

        return {
          _id: u._id,
          scheme_id: u.scheme_id._id,
          schemeName: u.scheme_id.scheme_name,
          version_number: u.version_number,
          date: u.date,
          change_type: u.change_type,
          modified_fields: u.modified_fields,
          reason: u.reason,
          verified_source: u.verified_source,
          verified_by: u.verified_by,
          impact,
          importance: u.change_type.includes("Closed") || u.change_type.includes("Limit") ? "High" : "Medium",
        };
      })
    );

    res.json({
      success: true,
      updates: feed.filter(Boolean),
    });
  } catch (err: any) {
    console.error("Feed loading error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSchemeVersionHistory = async (req: Request, res: Response) => {
  try {
    const { schemeId } = req.params;
    const scheme = await Scheme.findById(schemeId);
    if (!scheme) return res.status(404).json({ success: false, message: "Scheme not found" });

    res.json({
      success: true,
      versionHistory: scheme.version_history || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const triggerChangeCheck = async (req: Request, res: Response) => {
  try {
    // Simulate a scheme modification trigger (e.g. PM Kisan income limit increases)
    const scheme = await Scheme.findOne({ scheme_name: /Kisan|Housing|Scholarship/i });
    if (!scheme) return res.status(404).json({ success: false, message: "No compatible target schemes found for simulation" });

    const currentVersion = parseFloat(scheme.version_history?.[scheme.version_history.length - 1]?.version_number || "1.0");
    const nextVer = (currentVersion + 0.1).toFixed(1);

    // Clone current scheme params as previous baseline
    const oldScheme = JSON.parse(JSON.stringify(scheme));

    // Simulate an income limit hike or benefit increase
    const isBenefitHike = Math.random() > 0.5;
    const previousFields: any[] = [];
    
    if (isBenefitHike) {
      const oldBenefitStr = scheme.benefits[0] || "₹6,000 / year";
      const oldVal = parseInt(oldBenefitStr.replace(/[^0-9]/g, "")) || 6000;
      const newVal = oldVal + 2000;
      scheme.benefits = [`₹${newVal.toLocaleString("en-IN")} / year`, ...scheme.benefits.slice(1)];
    } else {
      const oldLimit = scheme.eligibility_rules?.income_limit || 200000;
      scheme.eligibility_rules.income_limit = oldLimit + 50000;
    }

    const mods = detectChanges(oldScheme, scheme);

    if (mods.length > 0) {
      const changeType = isBenefitHike ? "Benefit Increase" : "Income Limit Change";

      const updateRecord = new SchemeUpdate({
        scheme_id: scheme._id,
        version_number: nextVer,
        change_type: changeType,
        modified_fields: mods,
        reason: isBenefitHike ? "Union budget allocation expansion" : "Inflation index adjustment",
        verified_source: "https://pib.gov.in/notifications",
        verified_by: "Setu AI Verifier Agent",
      });
      await updateRecord.save();

      // Push into version history array
      scheme.version_history.push({
        version_number: nextVer,
        date: new Date(),
        change_type: changeType,
        modified_fields: mods,
        reason: updateRecord.reason,
        verified_source: updateRecord.verified_source,
        verified_by: updateRecord.verified_by,
      } as any);

      await scheme.save();

      // Trigger notifications broadcast
      await notifyAffectedUsers(updateRecord, scheme.scheme_name as string);

      return res.json({
        success: true,
        message: "Simulation trigger successful! Scheme updated and notifications broadcasted.",
        update: updateRecord,
      });
    }

    res.json({
      success: true,
      message: "No changes detected.",
    });
  } catch (err: any) {
    console.error("Change simulation error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyImpact = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const profile = await User.findById(userId);
    if (!profile) return res.status(404).json({ success: false, message: "User not found" });

    // 1. Fetch current eligible matches
    const matches = await findMatchingSchemes(profile);
    const matchedIds = matches.map((m) => m._id.toString());

    // 2. Fetch updates matching user's active matches
    const updates = await SchemeUpdate.find({ scheme_id: { $in: matchedIds } });

    // 3. Count impact classes
    const benefitIncreases = updates.filter((u) => u.change_type === "Benefit Increase").length;
    const docsChanged = updates.filter((u) => u.change_type === "Document Requirement Added" || u.change_type === "Document Removed").length;
    const upcomingDeadlines = updates.filter((u) => u.change_type === "Deadline Changed").length;

    res.json({
      success: true,
      dashboard: {
        newEligibleSchemes: matches.length > 2 ? 1 : 0, // Mock comparisons indicating updates unlocked matches
        removedSchemes: 0,
        benefitIncreases,
        documentsChanged: docsChanged,
        upcomingDeadlines,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
