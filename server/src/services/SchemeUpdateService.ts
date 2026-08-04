import Scheme from "../models/Scheme";
import SchemeUpdate from "../models/SchemeUpdate";
import User from "../models/user";

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

export interface ModificationField {
  field_name: string;
  previous_value: string;
  new_value: string;
}

export function detectChanges(oldScheme: any, newScheme: any): ModificationField[] {
  const modifications: ModificationField[] = [];

  const compareField = (name: string, path1: any, path2: any) => {
    if (path1 !== path2 && String(path1) !== String(path2)) {
      modifications.push({
        field_name: name,
        previous_value: String(path1 ?? "N/A"),
        new_value: String(path2 ?? "N/A"),
      });
    }
  };

  // 1. Income Limit
  const oldIncome = oldScheme.eligibility_rules?.income_limit;
  const newIncome = newScheme.eligibility_rules?.income_limit;
  compareField("Income Limit", oldIncome, newIncome);

  // 2. Age Limit
  const oldMinAge = oldScheme.eligibility_rules?.min_age;
  const newMinAge = newScheme.eligibility_rules?.min_age;
  const oldMaxAge = oldScheme.eligibility_rules?.max_age;
  const newMaxAge = newScheme.eligibility_rules?.max_age;
  if (oldMinAge !== newMinAge || oldMaxAge !== newMaxAge) {
    modifications.push({
      field_name: "Age Limits",
      previous_value: `Min: ${oldMinAge ?? 0}, Max: ${oldMaxAge ?? 100}`,
      new_value: `Min: ${newMinAge ?? 0}, Max: ${newMaxAge ?? 100}`,
    });
  }

  // 3. Benefits
  const oldBenefit = oldScheme.benefits?.[0];
  const newBenefit = newScheme.benefits?.[0];
  compareField("Financial Benefits", oldBenefit, newBenefit);

  // 4. Required Documents
  const oldDocs = (oldScheme.required_documents || []).join(", ");
  const newDocs = (newScheme.required_documents || []).join(", ");
  if (oldDocs !== newDocs) {
    modifications.push({
      field_name: "Required Documents",
      previous_value: oldDocs || "None",
      new_value: newDocs || "None",
    });
  }

  // 5. Official Link / Portal
  compareField("Application Portal Link", oldScheme.official_link, newScheme.official_link);

  return modifications;
}

export async function generateImpactAnalysis(update: any, userProfile: any, schemeName: string) {
  const aiClient = await getAIClient();

  const prompt = `
You are an expert government welfare case officer.
Explain how a government welfare scheme change affects the applicant.

Applicant Profile:
${JSON.stringify(userProfile)}

Scheme Name: ${schemeName}
Update Details:
- Change Type: ${update.change_type}
- Modified Fields: ${JSON.stringify(update.modified_fields)}
- Reason for change: ${update.reason || "Administrative policy update"}

Write a single brief sentence (max 15 words) explaining how this change affects this user directly.
Examples:
- "You became eligible as the income limit was raised."
- "Your estimated benefits increased by ₹10,000."
- "An additional document (Income Certificate) is now required."
- "Deadline extended: You have 15 more days to submit."

Rules:
- Address the citizen directly ("You became...", "Your benefits...").
- Keep it extremely short (under 15 words).
- Do not invent facts or hallucinate.
`;

  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return (response.text ?? "").trim().replace(/[".]/g, "");
  } catch (e) {
    console.error("Impact analysis failed:", e);
    return "Check details for updated eligibility checklist criteria adjustments";
  }
}

export async function notifyAffectedUsers(update: any, schemeName: string) {
  console.log(`🤖 Simulating WhatsApp broadcast for updated scheme: ${schemeName}`);
  
  // Find all profiles (mock query or sample)
  const users = await User.find({}).limit(5);
  users.forEach((user) => {
    // Simulated WhatsApp push notifications payload
    console.log(`💬 WhatsApp Alert Sent to ${user.name}: "${schemeName} was updated today. Tap to check your new eligibility roadmap."`);
  });

  return { success: true, notifiedCount: users.length };
}
