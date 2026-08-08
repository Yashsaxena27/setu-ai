import { Request, Response } from "express";
import { findMatchingSchemesWithReasons } from "../services/matchingService";
import { formatMatchResponse } from "../services/matchResponseFormatter";

export const matchSchemes = async (
  req: Request,
  res: Response
) => {
  try {
    const { matches, nonMatches } = await findMatchingSchemesWithReasons(req.body);

    const response = formatMatchResponse(matches);

    res.json({
      success: true,
      total: response.length,
      matches: response,
      nonMatches,
    });
  } catch (err: any) {
    console.error("===== MATCH ERROR =====");
    console.error(err);

    res.status(500).json({
      success: false,
      message: err?.message || "Matching failed",
    });
  }
};