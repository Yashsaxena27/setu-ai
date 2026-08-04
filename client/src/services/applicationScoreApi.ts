import { api } from "./api";

export interface SuccessScoreRecord {
  _id: string;
  user_id: string;
  scheme_id: string;
  overall_score: number;
  eligibility_score: number;
  document_score: number;
  profile_score: number;
  verification_score: number;
  draft_score: number;
  recommendations: Array<{
    priority: "High" | "Medium" | "Low";
    action: string;
    scoreIncrease: number;
  }>;
  risk_flags: string[];
  aiExplanation?: string;
  timeline?: string;
  journey?: Array<{ label: string; completed: boolean }>;
  weights?: {
    eligibility: number;
    documents: number;
    profile: number;
    verification: number;
    draft: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function getApplicationScore(schemeId: string) {
  return api<{ success: boolean; score: SuccessScoreRecord }>(`/application-score/${schemeId}`);
}

export function getApplicationScoreHistory(schemeId?: string) {
  const url = schemeId ? `/application-score/history?schemeId=${schemeId}` : "/application-score/history";
  return api<{ success: boolean; history: SuccessScoreRecord[] }>(url);
}

export function recalculateApplicationScore(schemeId: string) {
  return api<{ success: boolean; score: SuccessScoreRecord }>("/application-score/recalculate", {
    method: "POST",
    body: JSON.stringify({ schemeId }),
  });
}
