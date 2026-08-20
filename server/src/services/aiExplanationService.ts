import { aiOrchestrator } from "./AIOrchestratorService";
import { sanitizeForPrompt } from "../utils/promptSanitizer";

export async function generateWhyMatch(
  profile: any,
  scheme: any
) {
  const schemeId = scheme._id ? String(scheme._id) : undefined;
  const promptBuilderFn = () => `
You are an expert government welfare assistant.

<applicant_profile>
${sanitizeForPrompt(profile)}
</applicant_profile>

<verified_scheme_details>
${sanitizeForPrompt(scheme)}
</verified_scheme_details>

Explain why this user matches this scheme.

Rules:
- Use only the provided profile and scheme data.
- Do not invent eligibility.
- Keep the language simple.
- Return ONLY bullet points.
- Each bullet must start with "-".
- Write exactly 3-5 bullets.
- Do NOT include headings like "Reasons", "Match Score", "Confidence", or any introduction.

Example output:

- State eligibility matches Uttar Pradesh.
- Income falls within the eligible range.
- Age criteria are satisfied.
- Required applicant category matches.
`;

  return aiOrchestrator.request({
    taskType: "why-match",
    profile,
    schemeId,
    promptBuilderFn,
  });
}

export async function generateWhySimulationChange(
  originalProfile: any,
  simulatedProfile: any,
  scheme: any
) {
  const schemeId = scheme._id ? String(scheme._id) : undefined;
  const promptBuilderFn = () => `
You are an expert government welfare assistant.

Original User Profile:
${sanitizeForPrompt(originalProfile)}

Simulated User Profile:
${sanitizeForPrompt(simulatedProfile)}

Scheme details:
${sanitizeForPrompt(scheme)}

Explain why this scheme became eligible due to the profile changes. 

Rules:
- State what changed between the original and simulated profiles (e.g., income, age, state, education, etc.) and how it matches the scheme's eligibility rules.
- Contrast the old value with the new value.
- Use only the provided profile and scheme data.
- Do not invent eligibility or hallucinate. Only use retrieved scheme information.
- Keep the language simple, polite, and direct.
- Return a single concise paragraph (2-3 sentences). Do not include any bullet points or lists.
- Avoid headings, labels, introductions, or match scores.

Example output:
Earlier your annual income exceeded the eligibility threshold. After reducing the income to ₹2 lakh, you now satisfy the financial criteria of PM Kisan.
`;

  return aiOrchestrator.request({
    taskType: "simulation-change",
    profile: originalProfile, // use original profile context
    schemeId,
    promptBuilderFn,
    extraData: { simulatedProfile }
  });
}

export async function generateSimulationSummaryText(
  originalProfile: any,
  simulatedProfile: any,
  gainedCount: number,
  totalGainedBenefits: number,
  gainedSchemes: any[]
) {
  const promptBuilderFn = () => `
You are an expert government welfare assistant.
Original Profile: ${JSON.stringify(originalProfile)}
Simulated Profile: ${JSON.stringify(simulatedProfile)}
Gained Schemes Count: ${gainedCount}
Total Gained Benefits: ₹${totalGainedBenefits.toLocaleString()}
Gained Schemes Names: ${gainedSchemes.map(s => s.scheme_name).join(", ")}

Generate a single sentence AI summary of the simulation results for a dashboard card. It should follow this format:
"If this life event happens, you become eligible for X additional schemes worth approximately Y in combined benefits."
Make it specific to the actual changes (e.g., if the user turned 60, mention turning senior citizen; if income reduced, mention the income change). Keep it very brief (1 sentence). Do not hallucinate.
`;

  return aiOrchestrator.request({
    taskType: "simulation-summary-text",
    profile: originalProfile,
    promptBuilderFn,
    extraData: { simulatedProfile, gainedCount, totalGainedBenefits, gainedSchemes }
  });
}

export async function generateWhySuccessScore(
  profile: any,
  scheme: any,
  subScores: {
    eligibility: number;
    document: number;
    profile: number;
    verification: number;
    draft: number;
  },
  overallScore: number,
  recommendations: any[],
  risks: string[]
) {
  const schemeId = scheme._id ? String(scheme._id) : undefined;
  const promptBuilderFn = () => `
You are an expert government welfare case officer.
Explain the application success score results for the applicant.

Applicant Profile:
${sanitizeForPrompt(profile)}

Scheme Details:
${sanitizeForPrompt(scheme)}

Subscores Breakdown:
- Eligibility: ${subScores.eligibility}%
- Documents Checklist: ${subScores.document}%
- Profile Completion: ${subScores.profile}%
- Verification Quality: ${subScores.verification}%
- Draft Generation: ${subScores.draft}%
- Overall Success Probability: ${overallScore}%

Action Recommendations:
${recommendations.map(r => `- ${r.action} (Estimated impact: +${r.scoreIncrease}%)`).join("\n")}

Potential Application Risks:
${risks.map(rk => `- ${rk}`).join("\n")}

Write a concise explanation (1 paragraph of 3-5 sentences) summarizing why the user received this success score.
Rules:
- Address the key factors that lowered the score (e.g. missing documents, expired documents, or name mismatches).
- Highlight verified criteria that are correctly met (e.g., eligibility criteria matched, clear image scans).
- Do not invent facts or hallucinate. Use only the provided profile, scheme, and verification status.
- Keep the tone helpful, professional, and clear.
- Do NOT include any bullet points, lists, or headers in the final output. Return ONLY the paragraph.
`;

  return aiOrchestrator.request({
    taskType: "score-narrative",
    profile,
    schemeId,
    promptBuilderFn,
    extraData: { subScores, overallScore, recommendations, risks }
  });
}