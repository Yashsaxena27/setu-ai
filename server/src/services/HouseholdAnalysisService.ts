import FamilyMember from "../models/FamilyMember";
import HouseholdAnalysis from "../models/HouseholdAnalysis";
import Scheme from "../models/Scheme";
import { findMatchingSchemes } from "./matchingService";

import { aiOrchestrator } from "./AIOrchestratorService";

export function parseBenefitValue(benefitStr: string): number {
  if (!benefitStr) return 0;
  // Extract numbers
  const cleaned = benefitStr.replace(/,/g, "");
  const match = cleaned.match(/\d+/g);
  if (match) {
    // If multiple numbers, take the largest or first
    const vals = match.map(Number);
    return Math.max(...vals);
  }
  return 5000; // Baseline default if not parsable
}

export async function analyzeHouseholdInternal(userId: string) {
  const members = await FamilyMember.find({ user_id: userId });
  if (members.length === 0) {
    return {
      combined_benefits: 0,
      success_score: 0,
      insights: ["Add family members to run household welfare analysis."],
      member_analyses: [],
    };
  }

  const memberAnalyses: any[] = [];
  let totalBenefits = 0;
  let scoreSum = 0;

  const duplicateMap = new Map<string, string[]>(); // schemeName -> members who qualified

  for (const m of members) {
    // Run the matching engine
    const profileAdapter = {
      age: m.age,
      gender: m.gender,
      state: m.state,
      district: m.district || "",
      occupation: m.occupation || "Other",
      income: m.income,
      education: m.education || "None",
      category: m.category || "General",
      disability: m.disability,
      farmer: m.farmer,
      employmentStatus: m.employmentStatus || "Unemployed",
      studentStatus: m.studentStatus,
      maritalStatus: m.maritalStatus || "Single",
      dependents: m.dependents,
    };

    const matches = await findMatchingSchemes(profileAdapter);
    
    // Parse benefits
    let mBenefits = 0;
    matches.forEach((scheme) => {
      const valStr = scheme.benefits?.[0] || "";
      const val = parseBenefitValue(valStr);
      mBenefits += val;

      // Track potential family duplicate schemes
      const isFamilyScheme = /Housing|Awas|Ration|LPG|Ujjwala|Electricity/i.test(scheme.scheme_name);
      if (isFamilyScheme) {
        if (!duplicateMap.has(scheme.scheme_name)) {
          duplicateMap.set(scheme.scheme_name, []);
        }
        duplicateMap.get(scheme.scheme_name)!.push(m.name);
      }
    });

    totalBenefits += mBenefits;

    // Calculate baseline success score for member
    let mScore = 65;
    if (m.income < 150000) mScore += 15;
    if (m.disability) mScore += 10;
    if (m.farmer) mScore += 5;
    mScore = Math.min(95, Math.max(40, mScore));
    scoreSum += mScore;

    memberAnalyses.push({
      member_id: m._id,
      name: m.name,
      relationship: m.relationship,
      success_score: mScore,
      eligible_schemes: matches.map((sch) => sch._id),
      schemesCount: matches.length,
      estimated_benefits: mBenefits,
    });
  }

  const householdScore = Math.round(scoreSum / members.length);

  // Compile duplicate warning insights
  const duplicateWarnings: string[] = [];
  duplicateMap.forEach((names, schemeName) => {
    if (names.length > 1) {
      duplicateWarnings.push(
        `⚠️ Conflicting Matches: Both ${names.join(" and ")} qualified for "${schemeName}". Typically only one member per household can apply.`
      );
    }
  });

  // Call Gemini to generate family-level insights
  const insights = await generateHouseholdInsightsAI(members, memberAnalyses, duplicateWarnings);

  // Save to DB
  let analysis = await HouseholdAnalysis.findOne({ user_id: userId });
  if (analysis) {
    analysis.combined_benefits = totalBenefits;
    analysis.success_score = householdScore;
    analysis.insights = insights;
    analysis.member_analyses = memberAnalyses.map((ma) => ({
      member_id: ma.member_id,
      success_score: ma.success_score,
      eligible_schemes: ma.eligible_schemes,
    })) as any;
    await analysis.save();
  } else {
    analysis = new HouseholdAnalysis({
      user_id: userId,
      combined_benefits: totalBenefits,
      success_score: householdScore,
      insights,
      member_analyses: memberAnalyses.map((ma) => ({
        member_id: ma.member_id,
        success_score: ma.success_score,
        eligible_schemes: ma.eligible_schemes,
      })) as any,
    });
    await analysis.save();
  }

  return {
    ...analysis.toObject ? analysis.toObject() : analysis,
    memberAnalyses,
  };
}

async function generateHouseholdInsightsAI(members: any[], memberAnalyses: any[], duplicateWarnings: string[]) {
  const mainProfile = members[0] || {};
  const promptBuilderFn = () => `
You are an expert government welfare case officer.
Analyze this household family profile and suggest optimal benefit capture.

Household Members:
${JSON.stringify(members.map(m => ({ name: m.name, relationship: m.relationship, age: m.age, occupation: m.occupation, farmer: m.farmer })))}

Member Matched Count:
${JSON.stringify(memberAnalyses.map(ma => ({ name: ma.name, relationship: ma.relationship, count: ma.schemesCount, benefits: ma.estimated_benefits })))}

Provide 3 concise bullet recommendations (max 12 words per bullet) on how this household can maximize benefits.
Rules:
- Speak directly to the head of household.
- Call out specific members (e.g. "Daughter qualifies for scholarships...", "Grandfather qualifies for pensions...").
- Keep it extremely short (under 12 words per bullet).
- Never hallucinate names or files.
- Return ONLY the bullet points. Do NOT add headers or numbers.
`;

  const defaultInsights = [
    "Prioritize pension schemes verification checks for elder members.",
    "Submit student scholarship drafts before academic submission cycles.",
    "Verify land records maps to register farmers benefits.",
  ];

  try {
    const response = await aiOrchestrator.request({
      taskType: "household-recommendations",
      profile: mainProfile,
      promptBuilderFn,
      extraData: { memberAnalyses }
    });

    let bullets: string[] = [];
    if (Array.isArray(response)) {
      bullets = response;
    } else if (typeof response === "string") {
      bullets = response
        .split("\n")
        .map((b: string) => b.trim().replace(/^[-*•]\s*/, ""))
        .filter((b: string) => b.length > 0);
    }

    const merged = [...duplicateWarnings, ...bullets].slice(0, 5);
    return merged.length > 0 ? merged : defaultInsights;
  } catch (e) {
    console.error("Household AI Insights failed:", e);
    return [...duplicateWarnings, ...defaultInsights];
  }
}
