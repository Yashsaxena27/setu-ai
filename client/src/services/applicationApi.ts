import { api } from "./api";

export const getApplications = async () => {
  return await api<any>("/applications");
};

export const updateApplicationStatus = async (
  schemeId: string,
  status: string,
  extraPayload: any = {}
) => {
  return await api<any>("/applications/status", {
    method: "POST",
    body: JSON.stringify({ schemeId, status, ...extraPayload }),
  });
};

export const getRejectionRecovery = async (schemeId: string) => {
  return await api<any>("/applications/rejection-recovery", {
    method: "POST",
    body: JSON.stringify({ schemeId }),
  });
};

export const startApplication = async (id: string) => {
  return await api<any>(`/applications/${id}/start`, {
    method: "POST",
  });
};

export const getApplicationEvents = async (id: string) => {
  return await api<any>(`/applications/${id}/events`);
};
