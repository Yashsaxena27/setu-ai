import { api } from "./api";

export interface DigiLockerDoc {
  id: string;
  type: string;
  doc_number: string;
  issued_date: string;
}

export function connectDigiLocker() {
  return api<{ success: boolean; consentUrl: string; message: string }>("/digilocker/connect", {
    method: "POST",
  });
}

export function getDigiLockerDocuments() {
  return api<{ success: boolean; documents: DigiLockerDoc[] }>("/digilocker/documents");
}

export function importDigiLockerDocument(docId: string) {
  return api<{
    success: boolean;
    message: string;
    extracted: any;
    current: any;
    diffFields: string[];
  }>("/digilocker/import", {
    method: "POST",
    body: JSON.stringify({ docId }),
  });
}
