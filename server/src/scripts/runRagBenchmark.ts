import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Scheme from "../models/Scheme";
import { findMatchingSchemesWithReasons, RankingWeights, MatchingOptions } from "../services/matchingService";

dotenv.config();

export interface BenchmarkCase {
  id: string;
  category: string;
  description: string;
  profile: any;
  expectedRelevantSchemes: string[];
  disallowedSchemes: string[];
}

export type FailureClassification =
  | "SUCCESS"
  | "RETRIEVAL_FAILURE"
  | "RANKING_FAILURE"
  | "ELIGIBILITY_FAILURE"
  | "DATA_QUALITY_FAILURE"
  | "QUERY_CONSTRUCTION_FAILURE"
  | "INFRASTRUCTURE_FAILURE";

export interface QueryEvaluationResult {
  id: string;
  category: string;
  expectedCount: number;
  expectedSchemes: string[];
  retrievedTop1: string;
  retrievedTop3: string[];
  retrievedTop5: string[];
  retrievedTop10: string[];
  top1SemanticScore: number;
  top1HybridScore: number;
  top1EligibilityStatus: string;
  retrievalMode: "VECTOR_SEARCH" | "FALLBACK";
  pAt1: number;
  pAt3: number;
  pAt5: number;
  rAt5: number;
  rAt10: number;
  reciprocalRank: number;
  ndcgAt5: number;
  ndcgAt10: number;
  hasDisallowedFalsePositive: boolean;
  hasMatches: boolean;
  latencyMs: number;
  failureType: FailureClassification;
  failureNotes?: string;
}

export interface AggregateBenchmarkMetrics {
  configName: string;
  mode: "VECTOR_SEARCH" | "FALLBACK" | "AUTO_HYBRID";
  weights: RankingWeights;
  totalQueries: number;
  precisionAt1: number;
  precisionAt3: number;
  precisionAt5: number;
  recallAt5: number;
  recallAt10: number;
  mrr: number;
  ndcgAt5: number;
  ndcgAt10: number;
  falsePositiveRate: number;
  noResultRate: number;
  avgLatencyMs: number;
  deterministicEligibilityAccuracy: number;
  vectorSearchPercentage: number;
  fallbackPercentage: number;
}

function calculateDCG(retrievedNames: string[], expectedNames: Set<string>, k: number): number {
  let dcg = 0;
  for (let i = 0; i < Math.min(k, retrievedNames.length); i++) {
    const isRelevant = expectedNames.has(retrievedNames[i].toLowerCase().trim()) ? 1 : 0;
    dcg += (Math.pow(2, isRelevant) - 1) / Math.log2(i + 2); // i + 2 because i is 0-indexed (rank = i+1)
  }
  return dcg;
}

function calculateIDCG(expectedCount: number, k: number): number {
  let idcg = 0;
  const numRelevant = Math.min(expectedCount, k);
  for (let i = 0; i < numRelevant; i++) {
    idcg += (Math.pow(2, 1) - 1) / Math.log2(i + 2);
  }
  return idcg > 0 ? idcg : 1;
}

export async function evaluateConfiguration(
  cases: BenchmarkCase[],
  configName: string,
  weights: RankingWeights,
  forceMode?: "VECTOR_SEARCH" | "FALLBACK"
): Promise<{ metrics: AggregateBenchmarkMetrics; queryResults: QueryEvaluationResult[] }> {
  const queryResults: QueryEvaluationResult[] = [];
  let totalLatency = 0;
  let totalP1 = 0;
  let totalP3 = 0;
  let totalP5 = 0;
  let totalR5 = 0;
  let totalR10 = 0;
  let totalRR = 0;
  let totalNDCG5 = 0;
  let totalNDCG10 = 0;
  let falsePositiveCount = 0;
  let noResultCount = 0;
  let deterministicRulePassCount = 0;
  let vectorSearchUsedCount = 0;
  let fallbackUsedCount = 0;

  for (const q of cases) {
    const startTime = Date.now();

    // Execute ACTUAL PRODUCTION MATCHING PIPELINE
    const matchOptions: MatchingOptions = { weights, forceMode };
    const { matches, nonMatches, retrievalMode } = await findMatchingSchemesWithReasons(q.profile, matchOptions);
    const latencyMs = Date.now() - startTime;
    totalLatency += latencyMs;

    if (retrievalMode === "VECTOR_SEARCH") {
      vectorSearchUsedCount++;
    } else {
      fallbackUsedCount++;
    }

    const retrievedNames = matches.map((m: any) => m.scheme_name || "");
    const expectedSet = new Set(q.expectedRelevantSchemes.map((s) => s.toLowerCase().trim()));
    const disallowedSet = new Set(q.disallowedSchemes.map((s) => s.toLowerCase().trim()));

    const top1 = retrievedNames[0] || "None";
    const top3 = retrievedNames.slice(0, 3);
    const top5 = retrievedNames.slice(0, 5);
    const top10 = retrievedNames.slice(0, 10);

    const top1Obj = matches[0] || {};
    const top1Semantic = top1Obj.hybridBreakdown?.semanticScore ?? 0;
    const top1Hybrid = top1Obj.score ?? 0;
    const top1Status = top1Obj.eligibilityStatus || "NONE";

    // Precision@K
    const relevantInTop1 = top1 !== "None" && expectedSet.has(top1.toLowerCase().trim()) ? 1 : 0;
    const relevantInTop3 = top3.filter((name) => expectedSet.has(name.toLowerCase().trim())).length;
    const relevantInTop5 = top5.filter((name) => expectedSet.has(name.toLowerCase().trim())).length;
    const relevantInTop10 = top10.filter((name) => expectedSet.has(name.toLowerCase().trim())).length;

    const pAt1 = q.expectedRelevantSchemes.length === 0 ? (top1 === "None" ? 1 : 0) : relevantInTop1;
    const pAt3 = q.expectedRelevantSchemes.length === 0 ? (top3.length === 0 ? 1 : 0) : (top3.length > 0 ? relevantInTop3 / top3.length : 0);
    const pAt5 = q.expectedRelevantSchemes.length === 0 ? (top5.length === 0 ? 1 : 0) : (top5.length > 0 ? relevantInTop5 / top5.length : 0);

    // Recall@K
    const expectedCount = q.expectedRelevantSchemes.length;
    const rAt5 = expectedCount > 0 ? relevantInTop5 / expectedCount : (top5.length === 0 ? 1 : 0.5);
    const rAt10 = expectedCount > 0 ? relevantInTop10 / expectedCount : (top10.length === 0 ? 1 : 0.5);

    // Reciprocal Rank (MRR)
    let rankFirst = 0;
    for (let r = 0; r < retrievedNames.length; r++) {
      if (expectedSet.has(retrievedNames[r].toLowerCase().trim())) {
        rankFirst = r + 1;
        break;
      }
    }
    const reciprocalRank = expectedCount === 0 ? (matches.length === 0 ? 1 : 0.5) : (rankFirst > 0 ? 1 / rankFirst : 0);

    // NDCG@5 & NDCG@10
    const dcg5 = calculateDCG(retrievedNames, expectedSet, 5);
    const idcg5 = calculateIDCG(expectedCount, 5);
    const ndcgAt5 = expectedCount === 0 ? (retrievedNames.length === 0 ? 1 : 0.5) : dcg5 / idcg5;

    const dcg10 = calculateDCG(retrievedNames, expectedSet, 10);
    const idcg10 = calculateIDCG(expectedCount, 10);
    const ndcgAt10 = expectedCount === 0 ? (retrievedNames.length === 0 ? 1 : 0.5) : dcg10 / idcg10;

    // False positive check (did any strictly disallowed scheme appear in top 5?)
    const hasDisallowed = top5.some((name) => disallowedSet.has(name.toLowerCase().trim()));
    if (hasDisallowed) falsePositiveCount++;

    // Zero match check
    if (matches.length === 0) noResultCount++;

    // Deterministic Rule verification (all retrieved schemes must be ELIGIBLE or ACTION_REQUIRED)
    const allEligible = matches.every((m: any) => m.eligibilityStatus === "ELIGIBLE" || m.eligibilityStatus === "ACTION_REQUIRED");
    if (allEligible && !hasDisallowed) deterministicRulePassCount++;

    // Mandatory Failure Classification
    let failureType: FailureClassification = "SUCCESS";
    let failureNotes = "Retrieved target schemes successfully.";

    if (expectedCount > 0 && rAt5 < 0.3) {
      // Check if expected schemes were in nonMatches (eliminated by deterministic eligibility)
      const inNonMatches = nonMatches.some((nm: any) =>
        expectedSet.has((nm.scheme?.scheme_name || "").toLowerCase().trim())
      );
      if (inNonMatches) {
        failureType = "ELIGIBILITY_FAILURE";
        failureNotes = "Expected scheme was retrieved from DB but filtered out by deterministic rules.";
      } else if (retrievedNames.length < 5) {
        failureType = "RETRIEVAL_FAILURE";
        failureNotes = "Expected scheme did not enter vector/fallback candidate pool.";
      } else {
        failureType = "RANKING_FAILURE";
        failureNotes = "Expected scheme retrieved in candidate pool but scored below other candidates.";
      }
    } else if (hasDisallowed) {
      failureType = "ELIGIBILITY_FAILURE";
      failureNotes = "Disallowed scheme appeared in Top 5.";
    }

    totalP1 += pAt1;
    totalP3 += pAt3;
    totalP5 += pAt5;
    totalR5 += rAt5;
    totalR10 += rAt10;
    totalRR += reciprocalRank;
    totalNDCG5 += ndcgAt5;
    totalNDCG10 += ndcgAt10;

    queryResults.push({
      id: q.id,
      category: q.category,
      expectedCount,
      expectedSchemes: q.expectedRelevantSchemes,
      retrievedTop1: top1,
      retrievedTop3: top3,
      retrievedTop5: top5,
      retrievedTop10: top10,
      top1SemanticScore: top1Semantic,
      top1HybridScore: top1Hybrid,
      top1EligibilityStatus: top1Status,
      retrievalMode,
      pAt1: Math.round(pAt1 * 100) / 100,
      pAt3: Math.round(pAt3 * 100) / 100,
      pAt5: Math.round(pAt5 * 100) / 100,
      rAt5: Math.round(rAt5 * 100) / 100,
      rAt10: Math.round(rAt10 * 100) / 100,
      reciprocalRank: Math.round(reciprocalRank * 100) / 100,
      ndcgAt5: Math.round(ndcgAt5 * 100) / 100,
      ndcgAt10: Math.round(ndcgAt10 * 100) / 100,
      hasDisallowedFalsePositive: hasDisallowed,
      hasMatches: matches.length > 0,
      latencyMs,
      failureType,
      failureNotes,
    });
  }

  const total = cases.length;
  const metrics: AggregateBenchmarkMetrics = {
    configName,
    mode: forceMode || "AUTO_HYBRID",
    weights,
    totalQueries: total,
    precisionAt1: Math.round((totalP1 / total) * 1000) / 10,
    precisionAt3: Math.round((totalP3 / total) * 1000) / 10,
    precisionAt5: Math.round((totalP5 / total) * 1000) / 10,
    recallAt5: Math.round((totalR5 / total) * 1000) / 10,
    recallAt10: Math.round((totalR10 / total) * 1000) / 10,
    mrr: Math.round((totalRR / total) * 1000) / 1000,
    ndcgAt5: Math.round((totalNDCG5 / total) * 1000) / 1000,
    ndcgAt10: Math.round((totalNDCG10 / total) * 1000) / 1000,
    falsePositiveRate: Math.round((falsePositiveCount / total) * 1000) / 10,
    noResultRate: Math.round((noResultCount / total) * 1000) / 10,
    avgLatencyMs: Math.round(totalLatency / total),
    deterministicEligibilityAccuracy: Math.round((deterministicRulePassCount / total) * 1000) / 10,
    vectorSearchPercentage: Math.round((vectorSearchUsedCount / total) * 100),
    fallbackPercentage: Math.round((fallbackUsedCount / total) * 100),
  };

  return { metrics, queryResults };
}

export async function runFullRagBenchmark() {
  const jsonPath = path.resolve(__dirname, "../../../docs/rag-retrieval-benchmark-cases.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`FATAL: Benchmark cases file not found at: ${jsonPath}`);
    process.exit(1);
  }

  const cases: BenchmarkCase[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  console.log("================================================================================");
  console.log("             SETU AI: END-TO-END PRODUCTION RAG BENCHMARK PIPELINE              ");
  console.log("================================================================================");
  console.log(`Connecting to MongoDB Atlas...`);

  try {
    await mongoose.connect(process.env.MONGO_URI!, { serverSelectionTimeoutMS: 8000 });
    const totalSchemes = await Scheme.countDocuments();
    const embeddedSchemes = await Scheme.countDocuments({ embedding: { $exists: true, $ne: [] } });
    console.log(`Connected to database.`);
    console.log(`Total Schemes: ${totalSchemes} | Embedded Schemes: ${embeddedSchemes} (${Math.round((embeddedSchemes / totalSchemes) * 100)}%)`);
  } catch (err) {
    console.error("FATAL: MongoDB is unavailable. Cannot run real RAG retrieval evaluation.");
    console.error(err);
    process.exit(1);
  }

  // Weight baseline
  const baselineWeights: RankingWeights = { semantic: 0.40, state: 0.25, category: 0.20, freshness: 0.15 };

  console.log("\n>>> BENCHMARK 1: VECTOR SEARCH (LIVE ATLAS 3072-DIM COGNITIVE RETRIEVAL)");
  const vectorEval = await evaluateConfiguration(cases, "Vector Search (Atlas 3072-dim)", baselineWeights, "VECTOR_SEARCH");

  console.log("\n>>> BENCHMARK 2: DETERMINISTIC RANKED FALLBACK (LEXICAL + CONTEXTUAL)");
  const fallbackEval = await evaluateConfiguration(cases, "Ranked Fallback (Lexical/Context)", baselineWeights, "FALLBACK");

  console.log("\n>>> BENCHMARK 3: AUTO PRODUCTION PIPELINE (VECTOR FIRST WITH FALLBACK)");
  const autoEval = await evaluateConfiguration(cases, "Production Hybrid Auto Pipeline", baselineWeights);

  // Print Query-Level Breakdown for Production Auto Pipeline
  console.log("\n====================================================================================================");
  console.log("               PRODUCTION PIPELINE QUERY-BY-QUERY RETRIEVAL BREAKDOWN                               ");
  console.log("====================================================================================================");
  for (const r of autoEval.queryResults) {
    const statusIcon = r.failureType === "SUCCESS" ? "🟢" : r.failureType === "RANKING_FAILURE" ? "🟡" : "🔴";
    const modeTag = `[${r.retrievalMode.slice(0, 3)}]`;
    console.log(
      `${statusIcon} ${r.id.padEnd(8)} ${modeTag} | ${r.category.padEnd(36)} | NDCG@5: ${r.ndcgAt5.toFixed(2)} | P@3: ${r.pAt3.toFixed(2)} | Top-1: ${r.retrievedTop1.slice(0, 28).padEnd(28)} (${r.top1HybridScore}%) | Type: ${r.failureType}`
    );
  }

  // Print Failure Analysis Section
  const failedQueries = autoEval.queryResults.filter((r) => r.failureType !== "SUCCESS");
  console.log("\n====================================================================================================");
  console.log(`                     DETAILED FAILURE CASE ANALYSIS (${failedQueries.length} QUERIES)                               `);
  console.log("====================================================================================================");
  for (const f of failedQueries) {
    console.log(`\n▶ Query ${f.id} [${f.category}]`);
    console.log(`  Expected Schemes : ${f.expectedSchemes.join(", ") || "None (Negative Case)"}`);
    console.log(`  Retrieved Top 5  : ${f.retrievedTop5.join(", ") || "None"}`);
    console.log(`  Top-1 Score      : ${f.top1HybridScore}% (Semantic: ${f.top1SemanticScore}, Status: ${f.top1EligibilityStatus})`);
    console.log(`  Retrieval Mode   : ${f.retrievalMode}`);
    console.log(`  Failure Class    : ${f.failureType}`);
    console.log(`  Diagnosis Notes  : ${f.failureNotes}`);
  }

  // Print Comparative Metrics Table
  console.log("\n====================================================================================================");
  console.log("                     COMPARATIVE RETRIEVAL MODE BENCHMARK RESULTS                                   ");
  console.log("====================================================================================================");
  console.table(
    [vectorEval.metrics, fallbackEval.metrics, autoEval.metrics].map((m) => ({
      Pipeline: m.configName,
      "Mode": m.mode,
      "P@1 (%)": `${m.precisionAt1}%`,
      "P@3 (%)": `${m.precisionAt3}%`,
      "P@5 (%)": `${m.precisionAt5}%`,
      "R@5 (%)": `${m.recallAt5}%`,
      "R@10 (%)": `${m.recallAt10}%`,
      MRR: m.mrr,
      "NDCG@5": m.ndcgAt5,
      "NDCG@10": m.ndcgAt10,
      "False Pos (%)": `${m.falsePositiveRate}%`,
      "Avg Lat (ms)": `${m.avgLatencyMs}ms`,
      "Vector Search %": `${m.vectorSearchPercentage}%`,
      "Fallback %": `${m.fallbackPercentage}%`,
      "Det. Accuracy (%)": `${m.deterministicEligibilityAccuracy}%`,
    }))
  );

  await mongoose.disconnect();
  console.log("\n✅ RAG Benchmark execution completed successfully.");
}

if (require.main === module) {
  runFullRagBenchmark().catch((err) => {
    console.error("Benchmark failed:", err);
    process.exit(1);
  });
}
