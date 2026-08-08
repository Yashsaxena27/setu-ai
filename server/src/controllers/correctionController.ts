import { Request, Response } from "express";
import CorrectionReport from "../models/CorrectionReport";

export const reportCorrection = async (req: Request, res: Response) => {
  try {
    const { scheme_id, field_name, user_report } = req.body;
    const user_id = (req as any).userId; // set by authMiddleware

    if (!scheme_id || !field_name || !user_report) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof user_report !== "string" || user_report.length > 1000) {
      return res.status(400).json({ error: "User report must be a string under 1000 characters" });
    }

    if (typeof field_name !== "string" || field_name.length > 100) {
      return res.status(400).json({ error: "Field name must be a string under 100 characters" });
    }

    const report = new CorrectionReport({
      scheme_id,
      user_id,
      field_name,
      user_report,
    });

    await report.save();

    res.status(201).json({ message: "Correction report submitted successfully", report });
  } catch (error) {
    console.error("Error submitting correction report:", error);
    res.status(500).json({ error: "Failed to submit correction report" });
  }
};

export const getCorrectionReports = async (req: Request, res: Response) => {
  try {
    const reports = await CorrectionReport.find()
      .populate("scheme_id", "scheme_name")
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching correction reports:", error);
    res.status(500).json({ error: "Failed to fetch correction reports" });
  }
};

export const getSchemeCorrections = async (req: Request, res: Response) => {
  try {
    const { schemeId } = req.params;
    const reports = await CorrectionReport.find({ scheme_id: schemeId, status: "fixed" })
      .sort({ updatedAt: -1 })
      .limit(5);
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching scheme corrections:", error);
    res.status(500).json({ error: "Failed to fetch scheme corrections" });
  }
};

export const updateCorrectionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "reviewed", "fixed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const report = await CorrectionReport.findByIdAndUpdate(id, { status }, { new: true });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json({ message: "Status updated successfully", report });
  } catch (error) {
    console.error("Error updating correction status:", error);
    res.status(500).json({ error: "Failed to update correction status" });
  }
};
