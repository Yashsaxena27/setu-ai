import { aiOrchestrator } from "./AIOrchestratorService";

export async function generateDraft(
  profile: any,
  scheme: any
) {
  const schemeId = scheme._id ? String(scheme._id) : undefined;
  const promptBuilderFn = () => `
Generate a professional government application draft.

Applicant:
${JSON.stringify(profile)}

Scheme:
${JSON.stringify(scheme)}

Write the following sections:

# Applicant Summary

# Eligibility

# Purpose

# Submission Advice

Do NOT include Required Documents.

Return Markdown.
`;

  return aiOrchestrator.request({
    taskType: "draft",
    profile,
    schemeId,
    promptBuilderFn
  });
}