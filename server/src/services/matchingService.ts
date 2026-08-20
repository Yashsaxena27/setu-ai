import Scheme from "../models/Scheme";
import { generateEmbedding } from "./embeddingService";
import { NonMatchAnalysisService } from "./NonMatchAnalysisService";

export async function findMatchingSchemes(profile: any) {
  const { matches } = await findMatchingSchemesWithReasons(profile);
  return matches;
}

export async function findMatchingSchemesWithReasons(profile: any) {
  const userIncome = Number(profile.income || profile.annual_income || 0);
  const userAge = Number(profile.age || 0);
  const userState = (profile.state || "").trim();
  const userOccupation = (profile.occupation || "").trim().toLowerCase();

  const query = `
${profile.rawText ?? ""}

Age: ${userAge}
State: ${userState}
Occupation: ${profile.occupation ?? ""}
Income: ${userIncome}
Education: ${profile.education ?? ""}
`;

  let candidates: any[] = [];

  try {
    const embedding = await generateEmbedding(query);
    if (embedding && embedding.length > 0) {
      candidates = await Scheme.aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: embedding,
            numCandidates: 50,
            limit: 25,
          },
        },
        {
          $project: {
            scheme_name: 1,
            category: 1,
            summary_text: 1,
            eligibility_rules: 1,
            state_applicability: 1,
            benefits: 1,
            required_documents: 1,
            official_link: 1,
            score: {
              $meta: "vectorSearchScore",
            },
          },
        },
      ]);
    }
  } catch (err) {
    console.warn("Vector search fallback to collection scan:", err);
  }

  // Fallback if vector search failed or returned empty
  if (!candidates || candidates.length === 0) {
    const stateFilter = userState
      ? {
          $or: [
            { state_applicability: { $exists: false } },
            { state_applicability: { $size: 0 } },
            { state_applicability: { $in: [new RegExp(`^${userState}$`, "i"), "All", "all", "All India", "Pan India"] } },
          ],
        }
      : {};

    candidates = await Scheme.find({
      is_active: { $ne: false },
      ...stateFilter,
    }).lean();

    // If state filter returned 0, retrieve all active schemes
    if (!candidates || candidates.length === 0) {
      candidates = await Scheme.find({ is_active: { $ne: false } }).lean();
    }
  }

  const matches: any[] = [];
  const nonMatches: any[] = [];

  for (const scheme of candidates) {
    const reasons = NonMatchAnalysisService.analyzeNonMatch(profile, scheme);
    
    if (reasons.length === 0) {
      matches.push(scheme);
    } else {
      nonMatches.push({
        scheme,
        reasons
      });
    }
  }

  return { matches, nonMatches };

}