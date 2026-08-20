import Scheme from "../models/Scheme";
import { generateEmbedding } from "./embeddingService";
import { NonMatchAnalysisService, EligibilityClassification } from "./NonMatchAnalysisService";

export interface HybridScoreBreakdown {
  semanticScore: number;
  stateRelevance: number;
  categoryRelevance: number;
  freshnessScore: number;
  eligibilityMultiplier: number;
  finalScore: number;
  explanation: string;
}

export interface NoResultDiagnosis {
  hasMatches: boolean;
  totalEvaluated: number;
  eliminationBreakdown: Record<string, number>;
  missingProfileFields: string[];
  suggestedActions: string[];
  nearbyCandidates: Array<{
    scheme_name: string;
    category: string;
    primaryBlocker: string;
  }>;
}

export function deduplicateSchemes(schemes: any[]): any[] {
  const seen = new Set<string>();
  const deduplicated: any[] = [];

  for (const s of schemes) {
    const normName = (s.scheme_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const normUrl = (s.official_link || s.official_portal_url || "").toLowerCase().trim();
    const key = normName ? `name:${normName}` : `url:${normUrl}`;

    if (key && !seen.has(key)) {
      seen.add(key);
      deduplicated.push(s);
    }
  }

  return deduplicated;
}

export interface RankingWeights {
  semantic?: number;
  state?: number;
  category?: number;
  freshness?: number;
}

export function computeHybridScore(
  profile: any,
  scheme: any,
  classification: EligibilityClassification,
  vectorScore?: number,
  weights?: RankingWeights
): HybridScoreBreakdown {
  const userState = (profile.state || "").trim().toLowerCase();
  const userOccupation = (profile.occupation || "").trim().toLowerCase();

  const wSemantic = weights?.semantic ?? 0.40;
  const wState = weights?.state ?? 0.25;
  const wCategory = weights?.category ?? 0.20;
  const wFreshness = weights?.freshness ?? 0.15;

  // 1. Semantic Similarity Score (0.0 to 1.0)
  let semanticScore = 0.80; // Default baseline semantic relevance
  if (typeof vectorScore === "number" && !isNaN(vectorScore) && vectorScore > 0) {
    semanticScore = Math.min(1.0, Math.max(0.1, vectorScore > 1.0 ? vectorScore / 100 : vectorScore));
  }

  // 2. State Relevance (1.0 for specific state match, 0.90 for Pan India)
  let stateRelevance = 0.85;
  if (scheme.state_applicability && Array.isArray(scheme.state_applicability)) {
    const states = scheme.state_applicability.map((st: string) => st.toLowerCase().trim());
    if (userState && states.includes(userState)) {
      stateRelevance = 1.0;
    } else if (states.includes("all") || states.includes("all india") || states.includes("pan india")) {
      stateRelevance = 0.90;
    }
  }

  // 3. Category / Occupation Relevance (1.0 for direct occupation alignment, 0.80 general)
  let categoryRelevance = 0.80;
  const schemeOcc = (scheme.eligibility_rules?.occupation || "").toLowerCase();
  const schemeCat = (scheme.category || "").toLowerCase();
  if (userOccupation && (schemeOcc.includes(userOccupation) || schemeCat.includes(userOccupation))) {
    categoryRelevance = 1.0;
  }

  // 4. Data Freshness & Verification Score
  let freshnessScore = 0.90;
  if (scheme.freshness_status === "fresh" || scheme.last_verified_date) {
    freshnessScore = 1.0;
  } else if (scheme.freshness_status === "stale") {
    freshnessScore = 0.70;
  }

  // 5. Deterministic Eligibility Multiplier (1.0, 0.85, 0.70, or 0.0)
  const eligibilityMultiplier = classification.eligibilityMultiplier;

  // Hybrid Formula: (wSemantic * Semantic + wState * State + wCategory * Category + wFreshness * Freshness) * EligibilityMultiplier
  const rawScore =
    (wSemantic * semanticScore + wState * stateRelevance + wCategory * categoryRelevance + wFreshness * freshnessScore) *
    eligibilityMultiplier;

  const finalScore = Math.min(99, Math.max(0, Math.round(rawScore * 100)));

  const explanation = `Ranked with ${finalScore}% match: ${
    classification.status === "ELIGIBLE"
      ? "Fully meets demographic and regional eligibility criteria."
      : classification.status === "ACTION_REQUIRED"
      ? "Conditionally eligible pending document upload."
      : "Ineligible due to specific scheme constraints."
  }`;

  return {
    semanticScore: Math.round(semanticScore * 100) / 100,
    stateRelevance: Math.round(stateRelevance * 100) / 100,
    categoryRelevance: Math.round(categoryRelevance * 100) / 100,
    freshnessScore: Math.round(freshnessScore * 100) / 100,
    eligibilityMultiplier,
    finalScore,
    explanation,
  };
}

export function buildSemanticQuery(profile: any): string {
  const parts: string[] = [];

  if (profile.rawText && typeof profile.rawText === "string" && profile.rawText.trim().length > 0) {
    parts.push(profile.rawText.trim());
  }

  const occupation = profile.occupation || profile.trade || "";
  const state = profile.state || "";
  const caste = profile.caste || "";
  const income = profile.income || profile.annual_income;
  const age = profile.age;
  const education = profile.education || "";
  const disability = profile.disability === true || profile.disability === "Yes" || profile.disability === "true";

  const contextSegments: string[] = [];
  if (occupation) contextSegments.push(`Target Beneficiary / Occupation: ${occupation}`);
  if (state) contextSegments.push(`State Domicile: ${state}`);
  if (caste && caste !== "General") contextSegments.push(`Social Category: ${caste}`);
  if (education) contextSegments.push(`Education Level: ${education}`);
  if (disability) contextSegments.push(`Disability / PwD: Yes`);
  if (age) contextSegments.push(`Age: ${age}`);
  if (income !== undefined && income !== null && Number(income) > 0) contextSegments.push(`Annual Family Income: ₹${income}`);

  if (contextSegments.length > 0) {
    parts.push(contextSegments.join(" | "));
  }

  return parts.join("\n").trim() || "Government welfare schemes, financial subsidies, and citizen benefits in India";
}

export interface MatchingOptions {
  weights?: RankingWeights;
  forceMode?: "VECTOR_SEARCH" | "FALLBACK";
}

export async function findMatchingSchemes(profile: any, weights?: RankingWeights) {
  const { matches } = await findMatchingSchemesWithReasons(profile, { weights });
  return matches;
}

export async function findMatchingSchemesWithReasons(profile: any, optionsOrWeights?: MatchingOptions | RankingWeights) {
  const options: MatchingOptions =
    optionsOrWeights && ("weights" in optionsOrWeights || "forceMode" in optionsOrWeights)
      ? (optionsOrWeights as MatchingOptions)
      : { weights: optionsOrWeights as RankingWeights };

  const weights = options.weights;
  const forceMode = options.forceMode;

  const userIncome = Number(profile.income || profile.annual_income || 0);
  const userAge = Number(profile.age || 0);
  const userState = (profile.state || "").trim();
  const userOccupation = (profile.occupation || "").trim().toLowerCase();

  const semanticQuery = buildSemanticQuery(profile);
  let rawCandidates: any[] = [];
  let retrievalMode: "VECTOR_SEARCH" | "FALLBACK" = "FALLBACK";

  // STAGE 1: Semantic Vector Search (Unless explicitly forced to FALLBACK)
  if (forceMode !== "FALLBACK") {
    try {
      const embedding = await generateEmbedding(semanticQuery);
      if (embedding && embedding.length === 3072) {
        rawCandidates = await Scheme.aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: embedding,
              numCandidates: 100,
              limit: 50,
            },
          },
          {
            $project: {
              scheme_name: 1,
              category: 1,
              level: 1,
              summary_text: 1,
              eligibility_rules: 1,
              state_applicability: 1,
              benefits: 1,
              required_documents: 1,
              official_link: 1,
              department: 1,
              contactPhone: 1,
              contactEmail: 1,
              website: 1,
              officeHours: 1,
              supportLanguages: 1,
              freshness_status: 1,
              last_verified_date: 1,
              score: {
                $meta: "vectorSearchScore",
              },
            },
          },
        ]);

        if (rawCandidates && rawCandidates.length > 0) {
          retrievalMode = "VECTOR_SEARCH";
        }
      }
    } catch (err: any) {
      console.warn("Vector search fallback to ranked query:", err.message || err);
    }
  }

  // STAGE 2: Intelligent Relevance-Ranked Fallback (when Vector Search is unavailable or forced)
  if (!rawCandidates || rawCandidates.length === 0) {
    retrievalMode = "FALLBACK";
    const stateFilter = userState
      ? {
          $or: [
            { state_applicability: { $exists: false } },
            { state_applicability: { $size: 0 } },
            { state_applicability: { $in: [new RegExp(`^${userState}$`, "i"), "All", "all", "All India", "Pan India"] } },
          ],
        }
      : {};

    const fallbackPool = await Scheme.find({
      is_active: { $ne: false },
      ...stateFilter,
    }).lean();

    // Score fallback candidates by lexical & contextual relevance rather than random insertion order
    rawCandidates = fallbackPool.map((s: any) => {
      let fallbackScore = 0.50; // Baseline
      const sName = (s.scheme_name || "").toLowerCase();
      const sCat = (s.category || "").toLowerCase();
      const sOcc = (s.eligibility_rules?.occupation || "").toLowerCase();
      const sSummary = (s.summary_text || "").toLowerCase();
      const rawLower = (profile.rawText || "").toLowerCase();

      // Occupation match boost
      if (userOccupation && (sOcc.includes(userOccupation) || sCat.includes(userOccupation) || sName.includes(userOccupation))) {
        fallbackScore += 0.25;
      }
      // Raw text keyword match boost
      if (rawLower) {
        const keywords = rawLower.split(/\s+/).filter((w: string) => w.length > 3);
        let matchesCount = 0;
        for (const kw of keywords) {
          if (sName.includes(kw) || sSummary.includes(kw) || sCat.includes(kw)) {
            matchesCount++;
          }
        }
        fallbackScore += Math.min(0.20, matchesCount * 0.05);
      }

      return {
        ...s,
        score: Math.min(0.95, fallbackScore),
      };
    });

    // Sort fallback pool by computed fallbackScore descending
    rawCandidates.sort((a, b) => b.score - a.score);
  }

  // Deduplicate candidate schemes
  const candidates = deduplicateSchemes(rawCandidates);

  const matches: any[] = [];
  const nonMatches: any[] = [];
  const eliminationCounts: Record<string, number> = {};
  const missingFieldTracker = new Set<string>();

  // STAGE 3: Deterministic Rule Classification & Hybrid Scoring
  for (const scheme of candidates) {
    const classification = NonMatchAnalysisService.classifyEligibility(profile, scheme);
    const hybridScoring = computeHybridScore(profile, scheme, classification, scheme.score, weights);

    // Attach computed score and metadata
    const enrichedScheme = {
      ...scheme,
      score: hybridScoring.finalScore,
      hybridBreakdown: hybridScoring,
      eligibilityStatus: classification.status,
      passedRules: classification.passedRules,
      actionItems: classification.actionItems,
      reasons: classification.reasons,
    };

    if (classification.isEligible) {
      matches.push(enrichedScheme);
    } else {
      nonMatches.push({
        scheme: enrichedScheme,
        reasons: classification.reasons,
      });

      // Track elimination statistics for no-result diagnosis
      for (const r of classification.reasons) {
        eliminationCounts[r.reasonCode] = (eliminationCounts[r.reasonCode] || 0) + 1;
      }
      for (const f of classification.missingFields) {
        missingFieldTracker.add(f);
      }
    }
  }

  // STAGE 4: Hybrid Ranking (Eligible first, then by computed finalScore descending)
  matches.sort((a, b) => b.score - a.score);

  // STAGE 5: Structured No-Result Diagnosis
  const noResultDiagnosis: NoResultDiagnosis = {
    hasMatches: matches.length > 0,
    totalEvaluated: candidates.length,
    eliminationBreakdown: eliminationCounts,
    missingProfileFields: Array.from(missingFieldTracker),
    suggestedActions: [
      ...(missingFieldTracker.size > 0
        ? [`Complete missing demographic fields: ${Array.from(missingFieldTracker).join(", ")}`]
        : []),
      "Check that your annual income and state spelling align with official records.",
      "Explore the Eligibility Simulator to test prospective life changes.",
    ],
    nearbyCandidates: nonMatches.slice(0, 3).map((nm) => ({
      scheme_name: nm.scheme.scheme_name,
      category: nm.scheme.category,
      primaryBlocker: nm.reasons[0]?.explanation || "Criteria mismatch",
    })),
  };

  return {
    matches,
    nonMatches,
    retrievalMode,
    noResultDiagnosis: matches.length === 0 ? noResultDiagnosis : undefined,
  };
}