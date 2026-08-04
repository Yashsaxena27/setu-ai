import { api } from "./api";

export interface ModifiedField {
  field_name: string;
  previous_value: string;
  new_value: string;
}

export interface SchemeUpdateRecord {
  _id: string;
  scheme_id: string;
  schemeName: string;
  version_number: string;
  date: string;
  change_type: string;
  modified_fields: ModifiedField[];
  reason?: string;
  verified_source?: string;
  verified_by?: string;
  impact: string;
  importance: "High" | "Medium" | "Low";
}

export interface ImpactDashboard {
  newEligibleSchemes: number;
  removedSchemes: number;
  benefitIncreases: number;
  documentsChanged: number;
  upcomingDeadlines: number;
}

export function getUpdatesFeed(type: string = "all") {
  return api<{ success: boolean; updates: SchemeUpdateRecord[] }>(`/scheme-updates?type=${type}`);
}

export function getSchemeVersionHistory(schemeId: string) {
  return api<{ success: boolean; versionHistory: any[] }>(`/scheme-updates/${schemeId}`);
}

export function triggerChangeCheck() {
  return api<{ success: boolean; message: string; update?: SchemeUpdateRecord }>("/scheme-updates/check", {
    method: "POST",
  });
}

export function getMyImpact() {
  return api<{ success: boolean; dashboard: ImpactDashboard }>("/scheme-updates/my-impact");
}
