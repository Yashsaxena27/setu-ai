import { api } from "./api";

export interface DocumentVerificationRecord {
  _id: string;
  user_id: string;
  scheme_id: string;
  fileName: string;
  fileData?: string;
  mimeType: string;
  document_type: string;
  ocr_data?: {
    name: string | null;
    dob: string | null;
    address: string | null;
    issue_date: string | null;
    expiry_date: string | null;
    document_number: string | null;
    authority: string | null;
  };
  validation_status: string; // Pending, Verified, Needs Better Scan, Expired, Wrong Document, Name Mismatch, OCR Confidence Low
  confidence: number;
  quality_score: number;
  quality_issues: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReadinessResponse {
  success: boolean;
  schemeName: string;
  readiness_score: number;
  probability: "High" | "Medium" | "Low";
  explanation: string;
  missingDocs: Array<{ name: string; whyRequired: string }>;
  recommendations: string[];
  verifiedCount: number;
  totalCount: number;
}

export function uploadDocument(
  schemeId: string,
  documentType: string,
  fileName: string,
  fileData: string, // base64 string
  mimeType: string
) {
  return api<{ success: boolean; document: DocumentVerificationRecord }>("/documents/upload", {
    method: "POST",
    body: JSON.stringify({ schemeId, documentType, fileName, fileData, mimeType }),
  });
}

export function analyzeDocument(documentId: string) {
  return api<{ success: boolean; document: DocumentVerificationRecord; issues: string[] }>("/documents/analyze", {
    method: "POST",
    body: JSON.stringify({ documentId }),
  });
}

export function getDocumentsHistory(schemeId?: string) {
  const url = schemeId ? `/documents/history?schemeId=${schemeId}` : "/documents/history";
  return api<{ success: boolean; history: DocumentVerificationRecord[] }>(url);
}

export function getDocumentsReadiness(schemeId: string) {
  return api<ReadinessResponse>(`/documents/readiness?schemeId=${schemeId}`);
}

export function deleteDocument(id: string) {
  return api<{ success: boolean; message: string }>(`/documents/${id}`, {
    method: "DELETE",
  });
}
