import { Request, Response } from "express";
import DocumentVerification from "../models/DocumentVerification";
import User from "../models/user";
import Scheme from "../models/Scheme";

import { aiOrchestrator } from "../services/AIOrchestratorService";

function isNameMatching(docName: string, profileName: string): boolean {
  if (!docName || !profileName) return false;
  const dName = docName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const pName = profileName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return dName.includes(pName) || pName.includes(dName);
}

function isAgeMatching(dob: string, profileAgeStr: string): boolean {
  if (!dob || !profileAgeStr) return true;
  const matches = dob.match(/\b\d{4}\b/);
  if (matches) {
    const birthYear = parseInt(matches[0]);
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    const profileAge = parseInt(profileAgeStr);
    if (!isNaN(profileAge)) {
      return Math.abs(age - profileAge) <= 3; // Allow 3 years variance
    }
  }
  return true;
}

function isStateMatching(address: string, profileState: string): boolean {
  if (!address || !profileState) return true;
  const cleanAddr = address.toLowerCase();
  const cleanState = profileState.toLowerCase();
  return cleanAddr.includes(cleanState) || cleanState.includes(cleanAddr);
}

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { schemeId, documentType, fileName, fileData, mimeType } = req.body;

    if (!userId || !schemeId || !documentType || !fileData) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (schemeId, documentType, fileData, fileName)",
      });
    }

    const newDoc = new DocumentVerification({
      user_id: userId,
      scheme_id: schemeId,
      fileName: fileName || "document.jpg",
      fileData,
      mimeType: mimeType || "image/jpeg",
      document_type: documentType,
      validation_status: "Pending",
      confidence: 0,
      quality_score: 100,
      quality_issues: [],
      readiness_score: 0,
    });

    await newDoc.save();

    res.status(201).json({
      success: true,
      document: newDoc,
    });
  } catch (err: any) {
    console.error("Upload Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to upload document stub",
    });
  }
};

export const analyzeDocument = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { documentId } = req.body;

    if (!userId || !documentId) {
      return res.status(400).json({
        success: false,
        message: "Missing documentId",
      });
    }

    const doc = await DocumentVerification.findOne({ _id: documentId, user_id: userId });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document record not found",
      });
    }

    const userProfile = await User.findById(userId);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile reference not found",
      });
    }

    const promptBuilderFn = () => `
You are an expert government welfare document officer.
Analyze the provided document image/PDF and perform structured OCR and quality extraction.
You MUST output your analysis strictly in JSON format matching this schema:
{
  "document_type": "Aadhaar Card" | "PAN Card" | "Income Certificate" | "Caste Certificate" | "Domicile Certificate" | "Birth Certificate" | "Disability Certificate" | "Farmer Certificate" | "Education Certificate" | "Marksheet" | "Bank Passbook" | "Driving License" | "Passport" | "Any Government Certificate" | "Unknown Document",
  "confidence": number, // 0 to 100 representing classification confidence
  "ocr_data": {
    "name": string | null, // full name found on document
    "dob": string | null, // Date of birth (DD/MM/YYYY format if possible)
    "address": string | null, // full address
    "issue_date": string | null, // Issue date
    "expiry_date": string | null, // Expiry date (if specified)
    "document_number": string | null, // document ID number
    "authority": string | null // Issuing authority
  },
  "quality_detection": {
    "blur": boolean,
    "low_resolution": boolean,
    "cropping": boolean,
    "missing_corners": boolean,
    "dark_image": boolean,
    "glare": boolean,
    "unreadable_text": boolean,
    "rotation": boolean,
    "partial_scan": boolean
  }
}

Rules:
1. Extract name, dob, and expiry dates carefully if legible.
2. Determine if the document has defects like heavy blur, dark exposures, glare blocking fields, or cropped margins.
`;

    // Strip out base64 URL prefix if present (e.g. data:image/png;base64,)
    let cleanBase64 = doc.fileData || "";
    if (cleanBase64.includes(";base64,")) {
      cleanBase64 = cleanBase64.split(";base64,").pop() || "";
    }

    const aiJSON = await aiOrchestrator.request({
      taskType: "ocr",
      profile: userProfile,
      schemeId: doc.scheme_id ? String(doc.scheme_id) : undefined,
      promptBuilderFn,
      extraData: {
        fileData: cleanBase64,
        mimeType: doc.mimeType || "image/jpeg"
      }
    });

    const aiText = JSON.stringify(aiJSON);

    if (aiJSON.ocr_data?.name === "Generating...") {
      doc.document_type = "Unknown Document";
      doc.ocr_data = aiJSON.ocr_data;
      doc.validation_status = "Pending";
      doc.confidence = 0;
      doc.quality_score = 100;
      doc.quality_issues = [];
      await doc.save();

      return res.json({
        success: true,
        document: doc,
        issues: ["Document analysis is in progress. Please refresh in a moment."],
      });
    }

    // Programmatic Validation & Reconciliation against User Profile
    let status = "Verified";
    const issues: string[] = [];

    // Check classification accuracy
    if (
      aiJSON.document_type === "Unknown Document" ||
      (doc.document_type &&
        doc.document_type !== "Any Government Certificate" &&
        aiJSON.document_type.toLowerCase().replace(/\s/g, "") !==
          doc.document_type.toLowerCase().replace(/\s/g, ""))
    ) {
      status = "Wrong Document";
      issues.push(`Document classified as ${aiJSON.document_type} (expected ${doc.document_type})`);
    }

    // Expiry Check
    if (aiJSON.ocr_data?.expiry_date) {
      const expDate = new Date(aiJSON.ocr_data.expiry_date);
      if (!isNaN(expDate.getTime()) && expDate < new Date()) {
        status = "Expired";
        issues.push("Document validity has expired");
      }
    }

    // Name mismatch check
    if (
      userProfile.name &&
      aiJSON.ocr_data?.name &&
      !isNameMatching(aiJSON.ocr_data.name, userProfile.name)
    ) {
      status = "Name Mismatch";
      issues.push(`Name on document "${aiJSON.ocr_data.name}" does not match profile name "${userProfile.name}"`);
    }

    // DOB & State Mismatch
    if (aiJSON.ocr_data?.dob && userProfile.age && !isAgeMatching(aiJSON.ocr_data.dob, userProfile.age)) {
      issues.push(`DOB "${aiJSON.ocr_data.dob}" deviates from profile age (${userProfile.age} yrs)`);
    }
    if (aiJSON.ocr_data?.address && userProfile.state && !isStateMatching(aiJSON.ocr_data.address, userProfile.state)) {
      issues.push(`Address doesn't align with state: ${userProfile.state}`);
    }

    // Quality check flags
    const qIssues: string[] = [];
    if (aiJSON.quality_detection) {
      Object.entries(aiJSON.quality_detection).forEach(([key, val]) => {
        if (val === true) {
          qIssues.push(key.replace(/_/g, " "));
        }
      });
    }

    if (qIssues.length > 0) {
      if (status === "Verified") {
        status = "Needs Better Scan";
      }
      issues.push(`Quality issues found: ${qIssues.join(", ")}`);
    }

    if (aiJSON.confidence < 60) {
      if (status === "Verified" || status === "Needs Better Scan") {
        status = "OCR Confidence Low";
      }
    }

    // Calculate quality score
    const qualityDeduction = qIssues.length * 15;
    const qualityScore = Math.max(10, 100 - qualityDeduction);

    // Save outputs
    doc.document_type = aiJSON.document_type;
    doc.ocr_data = {
      name: aiJSON.ocr_data?.name || null,
      dob: aiJSON.ocr_data?.dob || null,
      address: aiJSON.ocr_data?.address || null,
      issue_date: aiJSON.ocr_data?.issue_date || null,
      expiry_date: aiJSON.ocr_data?.expiry_date || null,
      document_number: aiJSON.ocr_data?.document_number || null,
      authority: aiJSON.ocr_data?.authority || null,
      other_text: aiText,
    };
    doc.validation_status = status;
    doc.confidence = aiJSON.confidence || 50;
    doc.quality_score = qualityScore;
    doc.quality_issues = qIssues;

    await doc.save();

    res.json({
      success: true,
      document: doc,
      issues,
    });
  } catch (err: any) {
    console.error("Analysis Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to analyze document with AI",
    });
  }
};

export const getDocumentsHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { schemeId } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const query: any = { user_id: userId };
    if (schemeId) {
      query.scheme_id = schemeId;
    }

    const history = await DocumentVerification.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      history,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve documents history",
    });
  }
};

export const getDocumentsReadiness = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { schemeId } = req.query;

    if (!userId || !schemeId) {
      return res.status(400).json({
        success: false,
        message: "Missing schemeId",
      });
    }

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: "Scheme not found",
      });
    }

    const userProfile = await User.findById(userId);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile references missing",
      });
    }

    // Get all verifications for the user & scheme
    const uploads = await DocumentVerification.find({
      user_id: userId,
      scheme_id: schemeId,
    });

    const requiredDocs = scheme.required_documents || [];
    const missingDocs: any[] = [];
    const recommendations: string[] = [];

    // Group uploads by document type (keep the latest/highest status)
    const uploadsByType = new Map<string, typeof uploads[0]>();
    uploads.forEach((up) => {
      const type = up.document_type || "";
      if (!uploadsByType.has(type)) {
        uploadsByType.set(type, up);
      } else {
        const existing = uploadsByType.get(type)!;
        // prefer verified status
        if (existing.validation_status !== "Verified" && up.validation_status === "Verified") {
          uploadsByType.set(type, up);
        }
      }
    });

    let score = 100;
    const totalRequired = requiredDocs.length;

    if (totalRequired === 0) {
      score = 100;
    } else {
      // 1. Missing document check
      requiredDocs.forEach((reqDocName) => {
        const match = Array.from(uploadsByType.keys()).find((uploadedName) => {
          return (
            uploadedName.toLowerCase().includes(reqDocName.toLowerCase()) ||
            reqDocName.toLowerCase().includes(uploadedName.toLowerCase())
          );
        });

        if (!match) {
          missingDocs.push({
            name: reqDocName,
            whyRequired: `This scheme requires a valid ${reqDocName} to confirm eligibility criteria.`,
          });
          score -= Math.round(100 / totalRequired);
        }
      });
    }

    // 2. Penalties on uploaded documents
    uploads.forEach((up) => {
      if (up.validation_status === "Expired") {
        score -= 20;
        recommendations.push(`Renew your ${up.document_type} (file is expired).`);
      } else if (up.validation_status === "Name Mismatch") {
        score -= 15;
        recommendations.push(`Resolve name mismatch on ${up.document_type} (${up.ocr_data?.name || "Unknown"} vs profile).`);
      } else if (up.validation_status === "Needs Better Scan") {
        score -= 8;
        recommendations.push(`Re-upload ${up.document_type} with a clearer scan (detected issues: ${up.quality_issues?.join(", ")}).`);
      } else if (up.validation_status === "Wrong Document") {
        score -= 20;
        recommendations.push(`Upload the correct document for type ${up.document_type}.`);
      } else if (up.validation_status === "OCR Confidence Low") {
        score -= 5;
        recommendations.push(`Re-upload a higher resolution scan of your ${up.document_type}.`);
      }
    });

    score = Math.max(0, Math.min(score, 100));

    // Calculate probability
    let probability: "High" | "Medium" | "Low" = "Low";
    let explanation = "";

    if (score >= 80) {
      probability = "High";
      explanation = "All critical documents are uploaded and verified. Excellent profile alignment.";
    } else if (score >= 50) {
      probability = "Medium";
      explanation = "Basic documents uploaded but warnings exist or minor support documents are missing.";
    } else {
      probability = "Low";
      explanation = "Critical documentation is missing or documents are invalid/expired.";
    }

    if (missingDocs.length > 0) {
      recommendations.push(`Upload missing documents: ${missingDocs.map((d) => d.name).join(", ")}`);
    }

    if (recommendations.length === 0) {
      recommendations.push("Everything is ready. Proceed to generate draft.");
    }

    res.json({
      success: true,
      schemeName: scheme.scheme_name,
      readiness_score: score,
      probability,
      explanation,
      missingDocs,
      recommendations,
      verifiedCount: uploads.filter((u) => u.validation_status === "Verified").length,
      totalCount: uploads.length,
    });
  } catch (err: any) {
    console.error("Readiness Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to calculate readiness score",
    });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

    const doc = await DocumentVerification.findOneAndDelete({ _id: id, user_id: userId });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document verification record not found",
      });
    }

    res.json({
      success: true,
      message: "Document record permanently deleted",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to delete document record",
    });
  }
};
