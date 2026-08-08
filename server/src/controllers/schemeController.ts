import { Request, Response } from "express";
import Scheme from "../models/Scheme";
import { enrichScheme } from "../services/SchemeEnrichmentService";

export const getAllSchemes = async (_: Request, res: Response) => {
  try {
    const schemes = await Scheme.find();

    res.json(schemes);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch schemes",
    });
  }
};

export const getSchemeById = async (req: Request, res: Response) => {
  try {
    const scheme = await Scheme.findById(req.params.id);

    if (!scheme) {
      return res.status(404).json({
        message: "Scheme not found",
      });
    }

    if (!scheme.eligibility_examples || scheme.eligibility_examples.length === 0) {
      // Trigger enrichment asynchronously
      enrichScheme(scheme._id.toString()).catch(e => console.error("Enrichment error:", e));
    }

    res.json(scheme);
  } catch {
    res.status(500).json({
      message: "Error fetching scheme",
    });
  }
};