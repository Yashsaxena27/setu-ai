import Scheme from "../models/Scheme";
import DocumentVerification from "../models/DocumentVerification";
import ApplicationScore from "../models/ApplicationScore";

export interface ScoringWeights {
  eligibility: number;
  documents: number;
  profile: number;
  verification: number;
  draft: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  eligibility: 0.40,
  documents: 0.30,
  profile: 0.15,
  verification: 0.10,
  draft: 0.05,
};

export function calculateEligibilityScore(profile: any, scheme: any): number {
  if (!profile || !scheme) return 0;
  
  const userIncome = Number(profile.income || profile.annual_income || 0);
  const userAge = Number(profile.age || 0);
  const userState = (profile.state || "").trim();
  const userOccupation = (profile.occupation || "").trim().toLowerCase();

  const rules = scheme.eligibility_rules || {};
  let passedCount = 0;
  let totalCount = 4; // Checks: Age, State, Income, Occupation

  // 1. Age Filter Check
  const minAge = rules.min_age != null ? Number(rules.min_age) : 0;
  const maxAge = rules.max_age != null ? Number(rules.max_age) : 120;
  if (userAge >= minAge && userAge <= maxAge) {
    passedCount++;
  }

  // 2. State Applicability Check
  if (scheme.state_applicability && Array.isArray(scheme.state_applicability) && scheme.state_applicability.length > 0) {
    const states = scheme.state_applicability.map((s: string) => s.toLowerCase());
    const isAll = states.includes("all") || states.includes("all india") || states.includes("pan india");
    if (isAll || (userState && states.includes(userState.toLowerCase()))) {
      passedCount++;
    }
  } else {
    passedCount++;
  }

  // 3. Income Limit Check
  if (rules.income_limit != null) {
    const limit = Number(rules.income_limit);
    if (limit === 0 || userIncome <= limit) {
      passedCount++;
    }
  } else {
    passedCount++;
  }

  // 4. Occupation Filter Check
  if (rules.occupation && typeof rules.occupation === "string") {
    const ruleOcc = rules.occupation.toLowerCase();
    if (ruleOcc === "any" || ruleOcc === "citizen") {
      passedCount++;
    } else if (userOccupation) {
      const isDirectMatch = ruleOcc.includes(userOccupation) || userOccupation.includes(ruleOcc);
      const isFarmerMatch =
        userOccupation.includes("farmer") &&
        (ruleOcc.includes("farm") || ruleOcc.includes("agri") || ruleOcc.includes("kisan") || ruleOcc.includes("crop"));
      const isStudentMatch =
        userOccupation.includes("student") &&
        (ruleOcc.includes("student") || ruleOcc.includes("school") || ruleOcc.includes("scholarship") || ruleOcc.includes("education"));
      const isWomenMatch =
        (userOccupation.includes("woman") || userOccupation.includes("women") || userOccupation.includes("homemaker")) &&
        (ruleOcc.includes("woman") || ruleOcc.includes("women") || ruleOcc.includes("female") || ruleOcc.includes("lady") || ruleOcc.includes("shg"));
      const isUnemployedMatch =
        userOccupation.includes("unemployed") &&
        (ruleOcc.includes("unemployed") || ruleOcc.includes("youth"));
      const isBusinessMatch =
        (userOccupation.includes("business") || userOccupation.includes("self employed")) &&
        (ruleOcc.includes("business") || ruleOcc.includes("entrepreneur") || ruleOcc.includes("self-employed") || ruleOcc.includes("msme"));

      if (isDirectMatch || isFarmerMatch || isStudentMatch || isWomenMatch || isUnemployedMatch || isBusinessMatch) {
        passedCount++;
      }
    }
  } else {
    passedCount++;
  }

  return Math.round((passedCount / totalCount) * 100);
}

export function calculateDocumentScore(uploadedTypes: string[], requiredDocs: string[]): number {
  if (!requiredDocs || requiredDocs.length === 0) return 100;
  
  let uploadedRequiredCount = 0;
  
  requiredDocs.forEach((reqDoc) => {
    const match = uploadedTypes.find((upType) => {
      return (
        upType.toLowerCase().includes(reqDoc.toLowerCase()) ||
        reqDoc.toLowerCase().includes(upType.toLowerCase())
      );
    });
    if (match) {
      uploadedRequiredCount++;
    }
  });

  return Math.round((uploadedRequiredCount / requiredDocs.length) * 100);
}

export function calculateProfileScore(profile: any): number {
  if (!profile) return 0;
  
  const fields = [
    "name",
    "age",
    "gender",
    "state",
    "district",
    "occupation",
    "income",
    "education",
    "disability",
    "language",
    "phone",
  ];
  
  let filledCount = 0;
  fields.forEach((f) => {
    if (profile[f] !== undefined && profile[f] !== null && String(profile[f]).trim() !== "") {
      filledCount++;
    }
  });

  return Math.round((filledCount / fields.length) * 100);
}

export function calculateVerificationScore(uploads: any[]): number {
  if (!uploads || uploads.length === 0) return 100; // Default to 100% (zero defects) if no files uploaded

  let totalScore = 0;
  uploads.forEach((up) => {
    const status = up.validation_status || "Pending";
    if (status === "Verified") {
      totalScore += 100;
    } else if (status === "Needs Better Scan" || status === "OCR Confidence Low") {
      totalScore += 70;
    } else {
      totalScore += 30; // Expired, Wrong Document, Name Mismatch
    }
  });

  return Math.round(totalScore / uploads.length);
}

export async function calculateDraftScore(userId: string, schemeId: string): Promise<number> {
  const existing = await ApplicationScore.findOne({ user_id: userId, scheme_id: schemeId });
  return existing ? existing.draft_score : 0;
}

export function calculateOverallScore(
  eligibility: number,
  document: number,
  profile: number,
  verification: number,
  draft: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  const score =
    eligibility * weights.eligibility +
    document * weights.documents +
    profile * weights.profile +
    verification * weights.verification +
    draft * weights.draft;
  
  return Math.round(score);
}

export function generateRecommendations(
  profile: any,
  scheme: any,
  uploads: any[],
  requiredDocs: string[],
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  subScores: {
    eligibility: number;
    document: number;
    profile: number;
    verification: number;
    draft: number;
  }
) {
  const recommendations: Array<{ priority: "High" | "Medium" | "Low"; action: string; scoreIncrease: number }> = [];

  // 1. Missing Documents (High Priority)
  if (requiredDocs.length > 0) {
    const uploadedTypes = uploads.map((u) => u.document_type || "");
    requiredDocs.forEach((reqDoc) => {
      const match = uploadedTypes.find((upType) => {
        return (
          upType.toLowerCase().includes(reqDoc.toLowerCase()) ||
          reqDoc.toLowerCase().includes(upType.toLowerCase())
        );
      });
      if (!match) {
        // Score increase = weight of document * (100 / totalRequiredDocs)
        const inc = Math.round(weights.documents * (100 / requiredDocs.length));
        recommendations.push({
          priority: "High",
          action: `Upload missing required document: ${reqDoc}`,
          scoreIncrease: inc,
        });
      }
    });
  }

  // 2. Expired, Wrong, or Mismatched Documents (High Priority)
  uploads.forEach((up) => {
    const status = up.validation_status || "Pending";
    if (status === "Expired") {
      const inc = Math.round((weights.verification * 70) / Math.max(1, uploads.length));
      recommendations.push({
        priority: "High",
        action: `Renew expired ${up.document_type || "document"} (${up.fileName})`,
        scoreIncrease: inc,
      });
    } else if (status === "Name Mismatch") {
      const inc = Math.round((weights.verification * 70) / Math.max(1, uploads.length));
      recommendations.push({
        priority: "High",
        action: `Correct name mismatch on ${up.document_type || "document"}`,
        scoreIncrease: inc,
      });
    } else if (status === "Wrong Document") {
      const inc = Math.round((weights.verification * 70) / Math.max(1, uploads.length));
      recommendations.push({
        priority: "High",
        action: `Replace wrong document uploaded under ${up.document_type || "category"}`,
        scoreIncrease: inc,
      });
    }
  });

  // 3. Needs Better Scan / OCR Low Confidence (Medium Priority)
  uploads.forEach((up) => {
    const status = up.validation_status || "Pending";
    if (status === "Needs Better Scan" || status === "OCR Confidence Low") {
      const inc = Math.round((weights.verification * 30) / Math.max(1, uploads.length));
      recommendations.push({
        priority: "Medium",
        action: `Upload a clearer, high-resolution scan of ${up.document_type || "document"}`,
        scoreIncrease: inc,
      });
    }
  });

  // 4. Incomplete Profile (Medium Priority)
  if (subScores.profile < 100) {
    const fields = [
      "name",
      "age",
      "gender",
      "state",
      "district",
      "occupation",
      "income",
      "education",
      "disability",
      "language",
      "phone",
    ];
    const missingFields: string[] = [];
    fields.forEach((f) => {
      if (!profile[f] || String(profile[f]).trim() === "") {
        missingFields.push(f.charAt(0).toUpperCase() + f.slice(1));
      }
    });

    const inc = Math.round(weights.profile * (100 - subScores.profile));
    if (missingFields.length > 0 && inc > 0) {
      recommendations.push({
        priority: "Medium",
        action: `Complete profile details: Fill in missing fields (${missingFields.slice(0, 3).join(", ")})`,
        scoreIncrease: inc,
      });
    }
  }

  // 5. Missing Application Draft (Low Priority)
  if (subScores.draft < 100) {
    const inc = Math.round(weights.draft * 100);
    recommendations.push({
      priority: "Low",
      action: "Generate application letter draft",
      scoreIncrease: inc,
    });
  }

  return recommendations;
}

export function generateRiskFlags(uploads: any[], profile: any): string[] {
  const risks: string[] = [];

  uploads.forEach((up) => {
    const status = up.validation_status || "Pending";
    if (status === "Expired") {
      risks.push(`Validity of your uploaded ${up.document_type} has expired.`);
    } else if (status === "Name Mismatch") {
      risks.push(`Name spelling difference detected on ${up.document_type} (${up.ocr_data?.name || "extracted"} vs profile).`);
    } else if (status === "Wrong Document") {
      risks.push(`Wrong document type mismatch: Uploaded file is classified as ${up.document_type}.`);
    } else if (up.ocr_data?.expiry_date) {
      // Near Expiry check (within 30 days)
      const exp = new Date(up.ocr_data.expiry_date);
      const now = new Date();
      const diffTime = exp.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= 30) {
        risks.push(`Uploaded ${up.document_type} expires soon (in ${diffDays} days).`);
      }
    }

    if (up.quality_issues && Array.isArray(up.quality_issues) && up.quality_issues.length > 0) {
      risks.push(`Quality warning on ${up.document_type}: Scan issues detected (${up.quality_issues.join(", ")}).`);
    }
  });

  // Profile-based checks
  if (uploads.length > 0) {
    const hasAadhaar = uploads.some((u) => (u.document_type || "").includes("Aadhaar"));
    const hasBank = uploads.some((u) => (u.document_type || "").includes("Bank"));
    if (!hasBank) {
      risks.push("No bank verification document found. Direct benefit transfers might fail.");
    }
    if (!hasAadhaar) {
      risks.push("No Aadhaar card verification found (critical identity requirement).");
    }
  }

  return risks;
}

export function calculateTimeline(score: number): string {
  if (score >= 95) return "Ready Today";
  if (score >= 80) return "2 Days";
  if (score >= 50) return "1 Week";
  return "Needs Government Verification";
}

export function getReadinessJourney(subScores: {
  eligibility: number;
  document: number;
  profile: number;
  verification: number;
  draft: number;
}, overall: number) {
  return [
    { label: "Profile Complete", completed: subScores.profile >= 90 },
    { label: "Documents Verified", completed: subScores.verification >= 80 && subScores.document > 0 },
    { label: "Eligibility Confirmed", completed: subScores.eligibility === 100 },
    { label: "Application Draft Ready", completed: subScores.draft === 100 },
    { label: "Ready to Submit", completed: overall >= 90 },
  ];
}
