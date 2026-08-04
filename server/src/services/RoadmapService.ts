import Scheme from "../models/Scheme";
import User from "../models/user";
import DocumentVerification from "../models/DocumentVerification";
import ApplicationScore from "../models/ApplicationScore";
import ApplicationRoadmap from "../models/ApplicationRoadmap";
import { calculateProfileScore } from "./ApplicationScoringService";

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

export async function generateRoadmapInternal(userId: string, schemeId: string) {
  const scheme = await Scheme.findById(schemeId);
  if (!scheme) throw new Error("Scheme not found");

  const profile = await User.findById(userId);
  if (!profile) throw new Error("User profile not found");

  // Fetch documents and draft scores
  const uploads = await DocumentVerification.find({ user_id: userId, scheme_id: schemeId });
  const uploadedTypes = uploads.map((u) => u.document_type || "");
  const requiredDocs = scheme.required_documents || [];
  
  const scoreRecord = await ApplicationScore.findOne({ user_id: userId, scheme_id: schemeId });
  const hasDraft = scoreRecord ? scoreRecord.draft_score === 100 : false;
  const profileScore = calculateProfileScore(profile);

  // Check if there is an existing roadmap to preserve manual steps progress
  const existing = await ApplicationRoadmap.findOne({ user_id: userId, scheme_id: schemeId });
  const completedManualSteps = new Set<string>();
  if (existing) {
    existing.steps.forEach((s) => {
      if (s.status === "Completed" && ["step-5", "step-6", "step-7", "step-8"].includes(s.id)) {
        completedManualSteps.add(s.id);
      }
    });
  }

  // Define steps template
  const rawSteps = [
    {
      id: "step-1",
      title: "Complete Profile Wizard",
      status: profileScore === 100 ? "Completed" : "Pending",
      description: "Fill out your citizen profile parameters completely to unlock matches details.",
      estimated_time: "5 Mins",
      difficulty: "Easy",
      priority: "High",
      icon: "FaUserEdit",
      details: {
        whyRequired: "A complete profile is needed to accurately verify eligibility checks against scheme guidelines.",
        whereObtain: "Directly in the Setu AI Profile Wizard settings.",
        cost: "Free",
        processingTime: "Instant",
        office: "Online Portal",
        portal: "Setu AI Dashboard",
        reqDocuments: [],
        tips: ["Double check your annual income and occupation as these determine eligibility coefficients."],
        aiSuggestions: "Ensure your district is filled out as regional schemes verify geographical locations.",
      },
      resources: {
        website: "https://setu-ai.gov.in/profile",
        downloadForms: [],
        helpline: "1800-SETU-HELP",
        office: "Setu AI Support Desk",
        mapLocation: "",
      },
    },
    {
      id: "step-2",
      title: "Verify Aadhaar Identity",
      status: "Locked",
      description: "Upload and verify your Aadhaar card to confirm age and identity bounds.",
      estimated_time: "5 Mins",
      difficulty: "Easy",
      priority: "High",
      icon: "FaUserCheck",
      details: {
        whyRequired: "Identity verification is mandatory for all direct benefit transfer schemes.",
        whereObtain: "UIDAI Portal or nearest Aadhaar Enrollment Center.",
        cost: "Free / ₹50 for updates",
        processingTime: "Instant via AI scanner",
        office: "UIDAI Regional Office",
        portal: "https://myaadhaar.uidai.gov.in",
        reqDocuments: ["Aadhaar Enrollment Slip or Digital Copy"],
        tips: ["Ensure the photo scan is clear and free of reflections to prevent glare warnings."],
        aiSuggestions: "Name spelling in profile must align with name on Aadhaar Card.",
      },
      resources: {
        website: "https://uidai.gov.in",
        downloadForms: [],
        helpline: "1947",
        office: "Aadhaar Seva Kendra",
        mapLocation: "https://maps.google.com/?q=Aadhaar+Seva+Kendra",
      },
    },
    {
      id: "step-3",
      title: "Upload Mandatory Documents",
      status: "Locked",
      description: `Verify required files checklist: ${requiredDocs.join(", ") || "None required"}.`,
      estimated_time: "15 Mins",
      difficulty: "Medium",
      priority: "High",
      icon: "FaCloudUploadAlt",
      details: {
        whyRequired: `This scheme mandates verified copies of: ${requiredDocs.join(", ") || "No extra documents"} to verify parameters.`,
        whereObtain: "Revenue department website or regional Tahsildar office.",
        cost: "Free to ₹100",
        processingTime: "Instant verification check",
        office: "Local Tehsil Office",
        portal: "State e-District portal",
        reqDocuments: requiredDocs,
        tips: ["Verify issue dates are within current financial year (expired certs will deduct scores)."],
        aiSuggestions: "Scan in high resolution to prevent OCR extraction issues.",
      },
      resources: {
        website: "https://serviceonline.gov.in",
        downloadForms: [],
        helpline: "1800-EDISTRICT",
        office: "Tehsil CSC Center",
        mapLocation: "",
      },
    },
    {
      id: "step-4",
      title: "Generate Application Draft",
      status: "Locked",
      description: "Generate a custom application support letter outlining qualifications.",
      estimated_time: "2 Mins",
      difficulty: "Easy",
      priority: "Medium",
      icon: "FaRegFileAlt",
      details: {
        whyRequired: "A structured cover letter establishes a direct proof of eligibility for the case officer review.",
        whereObtain: "Generated directly inside the Setu AI Application Draft panel.",
        cost: "Free",
        processingTime: "Instant",
        office: "Online",
        portal: "Setu AI Draft Editor",
        reqDocuments: ["Verified Profile Details"],
        tips: ["Modify sections inside markdown editor if you have additional contextual details."],
        aiSuggestions: "Click the 'Prep Draft' button to instantly trigger cover letter generator.",
      },
      resources: {
        website: "https://setu-ai.gov.in/draft",
        downloadForms: [],
        helpline: "1800-SETU-HELP",
        office: "Setu AI Editor Desk",
        mapLocation: "",
      },
    },
    {
      id: "step-5",
      title: "Download Filled Draft",
      status: "Locked",
      description: "Download the completed markdown or PDF draft letter to attach.",
      estimated_time: "2 Mins",
      difficulty: "Easy",
      priority: "Medium",
      icon: "FaDownload",
      details: {
        whyRequired: "You must attach a printed copy of the support draft to the physical government packet.",
        whereObtain: "Download trigger inside the draft page.",
        cost: "Free",
        processingTime: "Instant",
        office: "Online",
        portal: "Setu AI Draft Editor",
        reqDocuments: [],
        tips: ["Store a digital copy on your phone to present at the local CSC desk."],
        aiSuggestions: "Verify all PDF margins look clean before downloading.",
      },
      resources: {
        website: "https://setu-ai.gov.in/draft",
        downloadForms: [],
        helpline: "1800-SETU-HELP",
        office: "Setu AI Editor Desk",
        mapLocation: "",
      },
    },
    {
      id: "step-6",
      title: "Visit CSC Office / Submission Portal",
      status: "Locked",
      description: "Submit files packet at local Common Service Center (CSC) or state portal.",
      estimated_time: "1 Day",
      difficulty: "Medium",
      priority: "High",
      icon: "FaExchangeAlt",
      details: {
        whyRequired: "Final verification and biometrics occur at a government desk or official portal.",
        whereObtain: "Local CSC center or state edistrict portal.",
        cost: "₹30 standard facilitation fee",
        processingTime: "1 to 2 Hours",
        office: "Common Service Center (CSC)",
        portal: "State e-District portal",
        reqDocuments: ["Aadhaar Card", "Filled Draft Letter", "Income Certificate"],
        tips: ["Carry original document copies for physical inspection comparison."],
        aiSuggestions: "Ask the desk officer for a submission receipt containing tracking parameters.",
      },
      resources: {
        website: "https://findmycsc.nic.in",
        downloadForms: [],
        helpline: "1800-CSC-HELP",
        office: "Local CSC Center",
        mapLocation: "https://maps.google.com/?q=Common+Service+Center",
      },
    },
    {
      id: "step-7",
      title: "Submit Application",
      status: "Locked",
      description: "Confirm and submit the welfare application request packet officially.",
      estimated_time: "1 Day",
      difficulty: "Medium",
      priority: "High",
      icon: "FaCheckCircle",
      details: {
        whyRequired: "Final portal click triggers the review pipeline under regional officers.",
        whereObtain: "CSC portal dashboard.",
        cost: "Varies",
        processingTime: "1 Day",
        office: "State Welfare Department",
        portal: "Official Scheme Portal",
        reqDocuments: [],
        tips: ["Double check bank account details to prevent transfer transaction failures."],
        aiSuggestions: "Save the confirmation PDF receipt securely.",
      },
      resources: {
        website: scheme.official_link || "https://india.gov.in",
        downloadForms: [],
        helpline: "1800-WELFARE",
        office: "Welfare Sub-Division Office",
        mapLocation: "",
      },
    },
    {
      id: "step-8",
      title: "Track Application",
      status: "Locked",
      description: "Log in and track application status using your submission receipt.",
      estimated_time: "Varies",
      difficulty: "Easy",
      priority: "Low",
      icon: "FaHistory",
      details: {
        whyRequired: "Tracks government approval cycles or document correction feedback warnings.",
        whereObtain: "Official scheme tracking URL.",
        cost: "Free",
        processingTime: "15 to 30 Days approval cycle",
        office: "District Welfare Officer Office",
        portal: "Official Scheme Tracking Portal",
        reqDocuments: ["Application ID"],
        tips: ["Set reminders for 15 days out to check matching status updates."],
        aiSuggestions: "Configure SMS notifications on the official portal if available.",
      },
      resources: {
        website: scheme.official_link || "https://india.gov.in",
        downloadForms: [],
        helpline: "1800-WELFARE",
        office: "District Welfare Office",
        mapLocation: "",
      },
    },
  ];

  // Evaluate smart dependencies
  // Step 1: Complete Profile
  const isProfileComplete = profileScore === 100;
  if (isProfileComplete) {
    rawSteps[0].status = "Completed";
  } else {
    rawSteps[0].status = "Pending";
  }

  // Step 2: Verify Aadhaar Card
  const aadhaarUpload = uploads.find((u) => (u.document_type || "").includes("Aadhaar"));
  const isAadhaarVerified = aadhaarUpload ? aadhaarUpload.validation_status === "Verified" : false;
  if (rawSteps[0].status === "Completed") {
    if (isAadhaarVerified) {
      rawSteps[1].status = "Completed";
    } else {
      rawSteps[1].status = "Pending";
    }
  }

  // Step 3: Upload Mandatory Documents
  let isDocsComplete = false;
  if (rawSteps[1].status === "Completed") {
    let uploadedRequiredCount = 0;
    requiredDocs.forEach((reqDoc) => {
      const match = uploadedTypes.find((upType) => {
        return (
          upType.toLowerCase().includes(reqDoc.toLowerCase()) ||
          reqDoc.toLowerCase().includes(upType.toLowerCase())
        );
      });
      // Find matching verified uploads
      const matchDoc = uploads.find((u) => u.document_type === match);
      if (matchDoc && matchDoc.validation_status === "Verified") {
        uploadedRequiredCount++;
      }
    });

    isDocsComplete = requiredDocs.length === 0 || uploadedRequiredCount === requiredDocs.length;
    if (isDocsComplete) {
      rawSteps[2].status = "Completed";
    } else {
      rawSteps[2].status = "Pending";
    }
  }

  // Step 4: Generate Application Draft
  if (rawSteps[2].status === "Completed") {
    if (hasDraft) {
      rawSteps[3].status = "Completed";
    } else {
      rawSteps[3].status = "Pending";
    }
  }

  // Restore manually completed steps if dependencies allow it
  const resolveManualStep = (idx: number, prevIdx: number, stepId: string) => {
    if (rawSteps[prevIdx].status === "Completed") {
      if (completedManualSteps.has(stepId)) {
        rawSteps[idx].status = "Completed";
      } else {
        rawSteps[idx].status = "Pending";
      }
    }
  };

  // Step 5: Download Filled Draft
  resolveManualStep(4, 3, "step-5");
  // Step 6: Visit CSC Office
  resolveManualStep(5, 4, "step-6");
  // Step 7: Submit Application
  resolveManualStep(6, 5, "step-7");
  // Step 8: Track Application
  resolveManualStep(7, 6, "step-8");

  // Calculate Progress percentage
  const completedCount = rawSteps.filter((s) => s.status === "Completed").length;
  const completionPercentage = Math.round((completedCount / rawSteps.length) * 100);

  // Determine current active step (first pending or locked step)
  const firstActive = rawSteps.find((s) => s.status !== "Completed");
  const currentStep = firstActive ? firstActive.id : "step-8";

  // Calculate remaining estimated completion duration
  let est = "2 Weeks";
  if (completionPercentage >= 95) est = "Ready Today";
  else if (completionPercentage >= 80) est = "2 Days";
  else if (completionPercentage >= 50) est = "1 Week";

  // Create or Update DB Record
  let roadmapRecord = await ApplicationRoadmap.findOne({ user_id: userId, scheme_id: schemeId });
  if (roadmapRecord) {
    roadmapRecord.steps = rawSteps as any;
    roadmapRecord.current_step = currentStep;
    roadmapRecord.progress = completedCount;
    roadmapRecord.completion_percentage = completionPercentage;
    roadmapRecord.estimated_completion = est;
    await roadmapRecord.save();
  } else {
    roadmapRecord = new ApplicationRoadmap({
      user_id: userId,
      scheme_id: schemeId,
      steps: rawSteps as any,
      current_step: currentStep,
      progress: completedCount,
      completion_percentage: completionPercentage,
      estimated_completion: est,
    });
    await roadmapRecord.save();
  }

  return {
    ...roadmapRecord.toObject ? roadmapRecord.toObject() : roadmapRecord,
    schemeName: scheme.scheme_name,
    successScore: scoreRecord ? scoreRecord.overall_score : 50,
  };
}

export async function generateRoadmapAIAdvice(
  profile: any,
  scheme: any,
  steps: any[],
  successScore: number,
  completionPercentage: number
) {
  const aiClient = await getAIClient();

  const activeStep = steps.find((s) => s.status !== "Completed") || steps[steps.length - 1];

  const prompt = `
You are an expert government welfare case officer.
Provide personalized AI Roadmap guidance for the user.

User Profile:
${JSON.stringify(profile)}

Scheme Details:
${JSON.stringify(scheme)}

Roadmap Current Steps:
${steps.map(s => `- ${s.title}: ${s.status} (Priority: ${s.priority}, Est Time: ${s.estimated_time})`).join("\n")}

Overall Success Score: ${successScore}%
Timeline Progress: ${completionPercentage}% Complete
Current Active Action Step: ${activeStep.title}

Write a helpful next-step guidance paragraph (2-3 sentences max) for a citizen roadmap assistant.
Rules:
- Speak directly to the citizen ("You should upload your Income Certificate next...").
- Highlight the score impact and estimated time (e.g. "This takes around 15 minutes and will raise your Success Score by 12%").
- Never hallucinate names or files.
- Return ONLY the paragraph text. Do NOT add headers or markdown lists.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return (response.text ?? "").trim();
  } catch (e) {
    console.error("AI Guidance failed:", e);
    return `Based on your progress, you should upload your outstanding mandatory documents next to increase compliance. This will maximize your application success score.`;
  }
}
