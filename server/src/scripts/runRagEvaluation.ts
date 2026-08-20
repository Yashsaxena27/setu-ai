import fs from "fs";
import path from "path";
import { NonMatchAnalysisService } from "../services/NonMatchAnalysisService";

interface RagTestCase {
  id: string;
  category: string;
  description: string;
  profile: any;
  targetScheme: any;
  expectedStatus: string;
  expectedEligible: boolean;
  expectedReasonCode?: string;
}

function runRagEvaluation() {
  const jsonPath = path.resolve(__dirname, "../../../docs/rag-evaluation-cases.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`FATAL: rag-evaluation-cases.json not found at ${jsonPath}`);
    process.exit(1);
  }

  const cases: RagTestCase[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  console.log("================================================================================");
  console.log("             SETU AI: 30-CASE RAG & ELIGIBILITY EVALUATION SUITE                ");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;
  let truePositives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  for (const tc of cases) {
    const classification = NonMatchAnalysisService.classifyEligibility(tc.profile, tc.targetScheme);

    const statusMatch = classification.status === tc.expectedStatus;
    const eligibilityMatch = classification.isEligible === tc.expectedEligible;

    let reasonMatch = true;
    if (tc.expectedReasonCode) {
      reasonMatch = classification.reasons.some((r) => r.reasonCode === tc.expectedReasonCode);
    }

    const testPassed = statusMatch && eligibilityMatch && reasonMatch;

    if (testPassed) {
      passed++;
      if (tc.expectedEligible) truePositives++;
      else trueNegatives++;
      console.log(`[PASS] ${tc.id.padEnd(8)} | ${tc.category.padEnd(40)} -> ${classification.status}`);
    } else {
      failed++;
      if (!tc.expectedEligible && classification.isEligible) falsePositives++;
      if (tc.expectedEligible && !classification.isEligible) falseNegatives++;
      console.error(
        `[FAIL] ${tc.id.padEnd(8)} | ${tc.category.padEnd(40)} -> Expected: ${tc.expectedStatus}, Got: ${classification.status}`
      );
      if (tc.expectedReasonCode && !reasonMatch) {
        console.error(`       Expected Reason Code: ${tc.expectedReasonCode}`);
        console.error(`       Actual Reasons:`, classification.reasons);
      }
    }
  }

  const total = cases.length;
  const accuracy = Math.round((passed / total) * 100);
  const precision = truePositives + falsePositives > 0 ? Math.round((truePositives / (truePositives + falsePositives)) * 100) : 100;
  const recall = truePositives + falseNegatives > 0 ? Math.round((truePositives / (truePositives + falseNegatives)) * 100) : 100;
  const falsePositiveRate = Math.round((falsePositives / total) * 100);
  const falseNegativeRate = Math.round((falseNegatives / total) * 100);

  console.log("================================================================================");
  console.log("             DETERMINISTIC ELIGIBILITY & RULE EVALUATION SUMMARY                ");
  console.log("================================================================================");
  console.log(`Total Evaluated Cases      : ${total}`);
  console.log(`Rule Engine Pass Rate      : ${passed} / ${total} (${accuracy}%)`);
  console.log(`Failed Cases               : ${failed}`);
  console.log(`Eligibility Classification : ${precision}% Precision / ${recall}% Recall (Rule Ground Truth)`);
  console.log(`False Positive Rate        : ${falsePositiveRate}% (0% ideal)`);
  console.log(`False Negative Rate        : ${falseNegativeRate}% (0% ideal)`);
  console.log("Note: Evaluates deterministic rule classification against 30 boundary scenarios.");
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRagEvaluation();
