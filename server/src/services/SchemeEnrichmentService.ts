import Scheme from "../models/Scheme";
import { aiOrchestrator } from "./AIOrchestratorService";

/**
 * AI Enrichment Hard Requirement:
 * Generate ONLY from verified scheme data.
 * No external facts, numbers, or procedures.
 */
export async function enrichScheme(schemeId: string) {
  const scheme = await Scheme.findById(schemeId);
  if (!scheme) throw new Error("Scheme not found");

  // Construct source payload for grounding
  const sourceData = JSON.stringify({
    name: scheme.scheme_name,
    eligibility_rules: scheme.eligibility_rules,
    benefits: scheme.benefits,
    required_documents: scheme.required_documents,
    application_steps: scheme.application_steps,
    summary_text: scheme.summary_text
  });

  // Task 1: Eligibility Examples (Personas)
  const examplesPrompt = () => `Generate ONLY from the following verified scheme data. Do NOT add any external facts, numbers, or procedures not present in the source. If you cannot generate a grounded response, return an empty array.
Source Data: ${sourceData}

Task: Create 2 concrete personas showing eligibility. One should be clearly eligible (✅) based on the rules, and one should be clearly ineligible (❌) based on the rules. 
Format as a JSON array of strings. Example:
[
  "✅ Suresh, 35, farmer... Eligible because...",
  "❌ Vikram, 45, govt employee... Not eligible because..."
]
Return ONLY a valid JSON array of strings.`;

  // Task 2: Common Mistakes & Practical Notes
  const mistakesPrompt = () => `Generate ONLY from the following verified scheme data. Do NOT add any external facts, numbers, or procedures not present in the source. If you cannot generate a grounded response, return an empty array.
Source Data: ${sourceData}

Task: Create 2-3 "Common Mistakes" applicants might make when applying for this scheme, and 2-3 "Practical Notes" derived strictly from the application steps or required documents.
Format as JSON:
{
  "common_mistakes": ["mistake 1", "mistake 2"],
  "practical_notes": ["note 1", "note 2"]
}
Return ONLY valid JSON.`;

  try {
    const examplesRes = await aiOrchestrator.request({
      taskType: "enrich-examples",
      profile: { id: "enrichment", ...scheme.toObject() },
      schemeId,
      promptBuilderFn: examplesPrompt
    });

    const mistakesRes = await aiOrchestrator.request({
      taskType: "enrich-mistakes",
      profile: { id: "enrichment", ...scheme.toObject() },
      schemeId,
      promptBuilderFn: mistakesPrompt
    });

    let examples = [];
    try {
      const cleaned = examplesRes.replace(/```json/g, '').replace(/```/g, '').trim();
      examples = JSON.parse(cleaned);
    } catch (e) {
      console.warn("Failed to parse eligibility examples", e);
    }

    let mistakes = [];
    let notes = [];
    try {
      const cleaned = mistakesRes.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      mistakes = parsed.common_mistakes || [];
      notes = parsed.practical_notes || [];
    } catch (e) {
      console.warn("Failed to parse common mistakes", e);
    }

    // Update scheme
    scheme.eligibility_examples = Array.isArray(examples) ? examples : [];
    scheme.common_mistakes = Array.isArray(mistakes) ? mistakes : [];
    scheme.practical_notes = Array.isArray(notes) ? notes : [];
    await scheme.save();

    return scheme;
  } catch (error) {
    console.error("Scheme enrichment failed", error);
    throw error;
  }
}
