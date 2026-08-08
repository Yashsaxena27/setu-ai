import { api } from "./api";

export const getApplications = async () => {
  return await api<any>("/user-applications");
};

export const updateApplicationStatus = async (
  schemeId: string,
  status: string,
  extraPayload: any = {}
) => {
  return await api<any>("/user-applications/status", {
    method: "POST",
    body: JSON.stringify({ schemeId, status, ...extraPayload }),
  });
};

export const getRejectionRecovery = async (schemeId: string) => {
  return await api<any>("/user-applications/rejection-recovery", {
    method: "POST",
    body: JSON.stringify({ schemeId }),
  });
};
