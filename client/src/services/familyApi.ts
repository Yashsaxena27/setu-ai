import { api } from "./api";

export interface FamilyMemberRecord {
  _id: string;
  name: string;
  relationship:
    | "Father"
    | "Mother"
    | "Brother"
    | "Sister"
    | "Grandfather"
    | "Grandmother"
    | "Husband"
    | "Wife"
    | "Son"
    | "Daughter"
    | "Guardian"
    | "Dependent"
    | "Other";
  age: number;
  gender: string;
  dob?: string;
  occupation?: string;
  income: number;
  education?: string;
  state: string;
  district?: string;
  category?: string;
  disability: boolean;
  farmer: boolean;
  employmentStatus?: string;
  studentStatus: boolean;
  maritalStatus?: string;
  dependents: number;
  language?: string;
  phone?: string;
}

export interface HouseholdOverview {
  totalMembers: number;
  eligibleSchemes: number;
  combinedBenefits: number;
  applicationsReady: number;
  pendingDocuments: number;
}

export interface MemberAnalysisDetails {
  member_id: string;
  name: string;
  relationship: string;
  success_score: number;
  eligible_schemes: string[];
  schemesCount: number;
  estimated_benefits: number;
}

export interface HouseholdAnalysisRecord {
  _id: string;
  user_id: string;
  combined_benefits: number;
  success_score: number;
  insights: string[];
  member_analyses: Array<{
    member_id: string;
    success_score: number;
    eligible_schemes: string[];
  }>;
  memberAnalyses: MemberAnalysisDetails[];
}

export function getFamilyProfile() {
  return api<{
    success: boolean;
    members: FamilyMemberRecord[];
    overview: HouseholdOverview;
  }>("/family");
}

export function addFamilyMember(data: Partial<FamilyMemberRecord>) {
  return api<{ success: boolean; member: FamilyMemberRecord }>("/family/member", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateFamilyMember(id: string, data: Partial<FamilyMemberRecord>) {
  return api<{ success: boolean; member: FamilyMemberRecord }>(`/family/member/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteFamilyMember(id: string) {
  return api<{ success: boolean; message: string }>(`/family/member/${id}`, {
    method: "DELETE",
  });
}

export function getHouseholdAnalysis() {
  return api<{ success: boolean; analysis: HouseholdAnalysisRecord }>("/family/analysis");
}
