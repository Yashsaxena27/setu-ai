import { api } from "./api";

export const getNextBestAction = async (schemeId?: string, missingDocs?: string[]) => {
  return await api<any>("/intelligence/next-best-action", {
    method: "POST",
    body: JSON.stringify({ schemeId, missingDocs }),
  });
};

export const getDeadlineIntelligence = async (schemeId: string) => {
  return await api<any>(`/intelligence/deadline/${schemeId}`);
};

export const getWhyNot = async (schemeId: string) => {
  return await api<any>(`/intelligence/why-not/${schemeId}`);
};

export const getPortfolioPlan = async () => {
  return await api<any>("/intelligence/portfolio");
};

export const explainPortfolio = async (plan: any, mode: "official" | "simple") => {
  return await api<any>("/intelligence/portfolio/explain", {
    method: "POST",
    body: JSON.stringify({ plan, mode }),
  });
};
