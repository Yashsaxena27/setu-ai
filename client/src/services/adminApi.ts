import { api } from "./api";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  applicationsGenerated: number;
  schemesViewed: number;
  applicationsReady: number;
  applicationsCompleted: number;
  successRate: number;
  verificationRate: number;
}

export interface AdminAnalytics {
  topStates: Array<{ state: string; count: number }>;
  mostViewedSchemes: Array<{ name: string; count: number }>;
  missingDocsList: Array<{ docName: string; rate: string }>;
  aiInsights: string[];
}

export function getAdminDashboardStats() {
  return api<{ success: boolean; stats: AdminStats }>("/admin/dashboard");
}

export function getAdminAnalytics() {
  return api<{ success: boolean; analytics: AdminAnalytics }>("/admin/analytics");
}

export function getAdminUsersList() {
  return api<{ success: boolean; users: any[] }>("/admin/users");
}

export function createAdminNotification(data: any) {
  return api<{ success: boolean; notification: any }>("/admin/notifications", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createSchemeAdmin(data: any) {
  return api<{ success: boolean; scheme: any }>("/admin/schemes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateSchemeAdmin(id: string, data: any) {
  return api<{ success: boolean; scheme: any }>(`/admin/schemes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteSchemeAdmin(id: string) {
  return api<{ success: boolean; message: string }>(`/admin/schemes/${id}`, {
    method: "DELETE",
  });
}

export function getAdminReportsList() {
  return api<{ success: boolean; reports: any[] }>("/admin/reports");
}
