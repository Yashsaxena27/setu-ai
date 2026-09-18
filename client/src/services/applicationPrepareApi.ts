import { api } from "./api";

export function prepareApplication(schemeId: string) {
  return api<{ success: boolean; application: any }>("/applications/prepare", {
    method: "POST",
    body: JSON.stringify({ schemeId }),
  });
}

export function getApplicationDetail(id: string) {
  return api<{ success: boolean; application: any }>(`/applications/detail/${id}`);
}

export function getApplicationForScheme(schemeId: string) {
  return api<{ success: boolean; application: any }>(`/applications/for-scheme/${schemeId}`);
}
