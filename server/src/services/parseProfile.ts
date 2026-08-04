import { aiOrchestrator } from "./AIOrchestratorService";

export async function parseProfile(message: string) {
  const promptBuilderFn = () => `
You are an AI that extracts structured user information.

Extract the following fields from the user's message.

Return ONLY valid JSON.

Schema:
{
  "age": number | null,
  "state": string | null,
  "occupation": string | null,
  "annual_income": number | null,
  "education": string | null
}

User Message:
${message}
`;

  const response = await aiOrchestrator.request({
    taskType: "parse-profile",
    profile: { rawText: message },
    promptBuilderFn
  });

  let profile: any = response;
  if (typeof response === "string") {
    try {
      const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
      profile = JSON.parse(cleaned);
    } catch (err) {
      console.error("Failed to parse profile JSON inside parseProfile:", err);
      profile = {};
    }
  }

  return {
    age: profile.age != null ? Number(profile.age) : null,
    state: profile.state || null,
    occupation: profile.occupation || null,
    annual_income: profile.annual_income != null ? Number(profile.annual_income) : (profile.income != null ? Number(profile.income) : null),
    education: profile.education || null,
    rawText: message,
  };
}