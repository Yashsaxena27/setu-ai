import { Request, Response } from "express";
import User from "../models/user";
import DocumentVerification from "../models/DocumentVerification";

let ai: any;

async function getAIClient() {
  if (!ai) {
    const { GoogleGenAI } = await import("@google/genai");
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }
  return ai;
}

// Mock government document store data
const MOCK_DIGILOCKER_DOCUMENTS = [
  {
    id: "aadhaar-1",
    type: "Aadhaar Card",
    doc_number: "UID-8274-1928-1092",
    raw_text: "UNIQUE IDENTIFICATION AUTHORITY OF INDIA. GOVERNMENT OF INDIA. Name: Ramesh Kumar. DOB: 12/05/1974. Gender: Male. Address: H-201, Connaught Place, New Delhi, PIN: 110001.",
    issued_date: "2021-05-10",
  },
  {
    id: "pan-1",
    type: "PAN Card",
    doc_number: "PAN-ABCDE1234F",
    raw_text: "INCOME TAX DEPARTMENT, GOVT OF INDIA. PERMANENT ACCOUNT NUMBER CARD. Name: Ramesh Kumar. DOB: 12/05/1974. Father's Name: Harish Kumar.",
    issued_date: "2020-03-12",
  },
  {
    id: "income-1",
    type: "Income Certificate",
    doc_number: "INC-2026-827419",
    raw_text: "DEPARTMENT OF REVENUE, GOVT OF NCT DELHI. INCOME CERTIFICATE. This is to certify that Ramesh Kumar, residing at New Delhi, has a verified family annual income of Rs. 1,80,000 (One Lakh Eighty Thousand Rupees).",
    issued_date: "2026-02-15",
  },
  {
    id: "farmer-1",
    type: "Farmer Certificate",
    doc_number: "FMR-9281-182",
    raw_text: "AGRICULTURE DEPARTMENT, GOVT OF UTTAR PRADESH. Kisan Credit Card & Farmer Registry. Name: Ramesh Kumar. Category: Small/Marginal Farmer. Land holding: 1.5 Hectares.",
    issued_date: "2023-11-20",
  }
];

export const connectDigiLocker = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Save consent log in user record
    await User.findByIdAndUpdate(userId, {
      consent_given: true,
      consent_timestamp: new Date(),
    });

    res.json({
      success: true,
      consentUrl: "https://mock.digilocker.gov.in/authorize?client_id=setu_ai_consent",
      message: "Consent successfully registered. Connected to DigiLocker mock gateway.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDigiLockerDocuments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    res.json({
      success: true,
      documents: MOCK_DIGILOCKER_DOCUMENTS.map((d) => ({
        id: d.id,
        type: d.type,
        doc_number: d.doc_number,
        issued_date: d.issued_date,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const importDigiLockerDocument = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { docId } = req.body;

    if (!userId || !docId) {
      return res.status(400).json({ success: false, message: "Missing docId in request body" });
    }

    const docObj = MOCK_DIGILOCKER_DOCUMENTS.find((d) => d.id === docId);
    if (!docObj) {
      return res.status(404).json({ success: false, message: "Requested document not found in DigiLocker vault" });
    }

    const profile = await User.findById(userId);
    if (!profile) return res.status(404).json({ success: false, message: "User not found" });

    const aiClient = await getAIClient();

    // Prompt Gemini to extract fields from the document text
    const prompt = `
You are an expert government document parser.
Analyze this official certificate text and extract profile parameters.

Document Type: ${docObj.type}
Document Text:
"${docObj.raw_text}"

Return ONLY a valid JSON block matching this exact TypeScript structure:
{
  "name": "Full Name",
  "dob": "YYYY-MM-DD",
  "gender": "Male" | "Female" | "Other",
  "state": "State name (e.g. Delhi, Uttar Pradesh)",
  "district": "District name (if available)",
  "income": "Annual income value as string (if available)",
  "occupation": "e.g. Farmer, Student, or Retired (if available)",
  "disability": "Yes" | "No",
  "farmer": true | false
}
`;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const resText = (response.text ?? "").trim();
    const cleaned = resText.replace(/```json/g, "").replace(/```/g, "").trim();
    const extracted = JSON.parse(cleaned);

    // Save as Verified Document
    const verification = new DocumentVerification({
      user_id: userId,
      document_type: docObj.type,
      validation_status: "Verified",
      readiness_score: 100,
      quality_issues: [],
      ocr_data: extracted,
      fileName: `DigiLocker_${docObj.type.replace(/\s+/g, "_")}.pdf`,
    });
    await verification.save();

    // Build diff compare
    const diffFields: string[] = [];
    const currentProfile: any = profile.toObject();

    const compareValues = (key: string, extVal: any, curVal: any) => {
      if (extVal && String(extVal).toLowerCase() !== String(curVal ?? "").toLowerCase()) {
        diffFields.push(key);
      }
    };

    compareValues("name", extracted.name, currentProfile.name);
    compareValues("gender", extracted.gender, currentProfile.gender);
    compareValues("state", extracted.state, currentProfile.state);
    compareValues("income", extracted.income, currentProfile.income);
    compareValues("occupation", extracted.occupation, currentProfile.occupation);

    res.json({
      success: true,
      message: `${docObj.type} successfully imported and verified.`,
      extracted,
      current: {
        name: currentProfile.name || "",
        age: currentProfile.age || "",
        gender: currentProfile.gender || "",
        state: currentProfile.state || "",
        district: currentProfile.district || "",
        occupation: currentProfile.occupation || "",
        income: currentProfile.income || "",
      },
      diffFields,
    });
  } catch (err: any) {
    console.error("Import DigiLocker error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
