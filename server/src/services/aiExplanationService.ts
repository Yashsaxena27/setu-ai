import { cache } from "../utils/cache";
import { profileHash } from "../utils/hash";

let ai: any;

async function initializeAI() {
  if (!ai) {
    const { GoogleGenAI } = await import("@google/genai");
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }
}

export async function generateWhyMatch(
  profile: any,
  scheme: any
) {
  await initializeAI();

  const key = `explain-${scheme._id}-${profileHash(profile)}`;

const cached = cache.get<string>(key);

if (cached) {
  console.log("✅ Cache Hit");
  return cached;
}

  const prompt = `
You are an expert government welfare assistant.

User Profile:
${JSON.stringify(profile, null, 2)}

Scheme:
${JSON.stringify(scheme, null, 2)}

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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const explanation = response.text ?? "";

    cache.set(key, explanation);

    return explanation;
  } catch (error) {
    console.error("Gemini Error:", error);

    const cached = cache.get<string>(key);

    if (cached) {
      return cached;
    }

    return `
• This scheme appears to match your profile.
• Please verify the eligibility on the official government website.
• AI explanation is temporarily unavailable.
`;
  }
}

export async function generateWhySimulationChange(
  originalProfile: any,
  simulatedProfile: any,
  scheme: any
) {
  await initializeAI();

  const key = `explain-sim-${scheme._id}-${profileHash(originalProfile)}-${profileHash(simulatedProfile)}`;

  const cached = cache.get<string>(key);
  if (cached) {
    console.log("✅ Simulation Explain Cache Hit");
    return cached;
  }

  const prompt = `
You are an expert government welfare assistant.

Original User Profile:
${JSON.stringify(originalProfile, null, 2)}

Simulated User Profile:
${JSON.stringify(simulatedProfile, null, 2)}

Scheme details:
${JSON.stringify(scheme, null, 2)}

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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const explanation = response.text ?? "";
    const cleanExplanation = explanation.trim();
    cache.set(key, cleanExplanation);
    return cleanExplanation;
  } catch (error) {
    console.error("Gemini Simulation Error:", error);
    return `Earlier demographic constraints prevented eligibility. After updating your profile parameters, you now satisfy the criteria for ${scheme.scheme_name}.`;
  }
}

export async function generateSimulationSummaryText(
  originalProfile: any,
  simulatedProfile: any,
  gainedCount: number,
  totalGainedBenefits: number,
  gainedSchemes: any[]
) {
  await initializeAI();

  const key = `sim-summary-${gainedCount}-${totalGainedBenefits}-${profileHash(originalProfile)}-${profileHash(simulatedProfile)}`;
  const cached = cache.get<string>(key);
  if (cached) {
    return cached;
  }

  const prompt = `
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const summary = response.text ?? "";
    const cleanSummary = summary.trim();
    cache.set(key, cleanSummary);
    return cleanSummary;
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return `If this life event occurs, you will gain eligibility for ${gainedCount} additional schemes worth approximately ₹${totalGainedBenefits.toLocaleString()} in benefits.`;
  }
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
  await initializeAI();

  const key = `explain-score-${scheme._id}-${profileHash(profile)}-${overallScore}`;

  const cached = cache.get<string>(key);
  if (cached) {
    console.log("✅ Success Score Explain Cache Hit");
    return cached;
  }

  const prompt = `
You are an expert government welfare case officer.
Explain the application success score results for the applicant.

Applicant Profile:
${JSON.stringify(profile)}

Scheme Details:
${JSON.stringify(scheme)}

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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const explanation = response.text ?? "";
    const cleanExplanation = explanation.trim();
    cache.set(key, cleanExplanation);
    return cleanExplanation;
  } catch (error) {
    console.error("Gemini Success Score Error:", error);
    return `Your eligibility matches the requirements. However, missing or unverified documents affect your readiness score. Complete the checklist recommendations to maximize probability of approval.`;
  }
}