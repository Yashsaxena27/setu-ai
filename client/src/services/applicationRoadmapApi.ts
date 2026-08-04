import { api } from "./api";

export interface RoadmapStep {
  id: string;
  title: string;
  status: "Completed" | "Pending" | "Locked";
  description: string;
  estimated_time: string;
  difficulty: "Easy" | "Medium" | "Hard";
  priority: "High" | "Medium" | "Low";
  icon: string;
  details: {
    whyRequired: string;
    whereObtain: string;
    cost: string;
    processingTime: string;
    office: string;
    portal: string;
    reqDocuments: string[];
    tips: string[];
    aiSuggestions: string;
  };
  resources: {
    website: string;
    downloadForms: string[];
    helpline: string;
    office: string;
    mapLocation: string;
  };
}

export interface ApplicationRoadmapRecord {
  _id: string;
  user_id: string;
  scheme_id: string;
  steps: RoadmapStep[];
  current_step: string;
  progress: number;
  completion_percentage: number;
  estimated_completion: string;
  schemeName: string;
  successScore: number;
  aiGuidance?: string;
  createdAt: string;
  updatedAt: string;
}

export function getApplicationRoadmap(schemeId: string) {
  return api<{ success: boolean; roadmap: ApplicationRoadmapRecord }>(`/application-roadmap/${schemeId}`);
}

export function completeRoadmapStep(schemeId: string, stepId: string) {
  return api<{ success: boolean; roadmap: ApplicationRoadmapRecord }>("/application-roadmap/complete-step", {
    method: "POST",
    body: JSON.stringify({ schemeId, stepId }),
  });
}

export function getApplicationRoadmapsHistory(schemeId?: string) {
  const url = schemeId ? `/application-roadmap/history?schemeId=${schemeId}` : "/application-roadmap/history";
  return api<{ success: boolean; roadmaps: ApplicationRoadmapRecord[] }>(url);
}

export function sendRoadmapWhatsApp(schemeId: string) {
  return api<{ success: boolean; message: string; phone: string }>("/application-roadmap/whatsapp", {
    method: "POST",
    body: JSON.stringify({ schemeId }),
  });
}
