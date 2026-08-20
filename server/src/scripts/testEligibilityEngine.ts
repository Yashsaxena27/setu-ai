import { NonMatchAnalysisService } from "../services/NonMatchAnalysisService";

function assert(condition: boolean, testName: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${testName}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${testName}`);
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("  SETU AI: DETERMINISTIC ELIGIBILITY TEST SUITE  ");
  console.log("=================================================");

  // TEST 1: Perfect Match
  const perfectFarmer = {
    age: 45,
    gender: "female",
    state: "Uttar Pradesh",
    income: 120000,
    occupation: "Farmer",
    caste: "OBC",
  };
  const pmKisanScheme = {
    scheme_name: "PM Kisan Samman Nidhi",
    state_applicability: ["All", "Uttar Pradesh"],
    eligibility_rules: {
      min_age: 18,
      max_age: 75,
      income_limit: 200000,
      occupation: "farmer",
    },
  };
  const reasons1 = NonMatchAnalysisService.analyzeNonMatch(perfectFarmer, pmKisanScheme);
  assert(reasons1.length === 0, "Test 1: Perfect match produces zero non-match reasons");

  // TEST 2: Income Ceiling Exceeded
  const highIncomeCitizen = {
    ...perfectFarmer,
    income: 500000,
  };
  const reasons2 = NonMatchAnalysisService.analyzeNonMatch(highIncomeCitizen, pmKisanScheme);
  assert(
    reasons2.some((r) => r.reasonCode === "INCOME_LIMIT_EXCEEDED"),
    "Test 2: Income above limit correctly triggers INCOME_LIMIT_EXCEEDED"
  );

  // TEST 3: State Restriction
  const biharCitizen = {
    ...perfectFarmer,
    state: "Bihar",
  };
  const maharashtraScheme = {
    scheme_name: "Majhi Kanya Bhagyashree",
    state_applicability: ["Maharashtra"],
    eligibility_rules: { min_age: 0, max_age: 18 },
  };
  const reasons3 = NonMatchAnalysisService.analyzeNonMatch(biharCitizen, maharashtraScheme);
  assert(
    reasons3.some((r) => r.reasonCode === "STATE_RESTRICTED"),
    "Test 3: Out-of-state citizen correctly triggers STATE_RESTRICTED"
  );

  // TEST 4: Underage
  const youthCitizen = {
    ...perfectFarmer,
    age: 15,
  };
  const adultScheme = {
    scheme_name: "PM Shram Yogi Maandhan",
    state_applicability: ["All"],
    eligibility_rules: { min_age: 18, max_age: 40 },
  };
  const reasons4 = NonMatchAnalysisService.analyzeNonMatch(youthCitizen, adultScheme);
  assert(
    reasons4.some((r) => r.reasonCode === "AGE_MISMATCH"),
    "Test 4: Applicant under 18 correctly triggers AGE_MISMATCH"
  );

  // TEST 5: Occupation Restriction
  const studentCitizen = {
    ...perfectFarmer,
    occupation: "Student",
  };
  const reasons5 = NonMatchAnalysisService.analyzeNonMatch(studentCitizen, pmKisanScheme);
  assert(
    reasons5.some((r) => r.reasonCode === "OCCUPATION_MISMATCH"),
    "Test 5: Student applying for farmer-only scheme triggers OCCUPATION_MISMATCH"
  );

  // TEST 6: Caste Category Restriction
  const generalCitizen = {
    ...perfectFarmer,
    caste: "General",
  };
  const tribalScheme = {
    scheme_name: "Post Matric Scholarship for ST Students",
    state_applicability: ["All"],
    eligibility_rules: { caste: "ST" },
  };
  const reasons6 = NonMatchAnalysisService.analyzeNonMatch(generalCitizen, tribalScheme);
  assert(
    reasons6.some((r) => r.reasonCode === "CASTE_MISMATCH"),
    "Test 6: Non-ST applicant for ST scholarship triggers CASTE_MISMATCH"
  );

  // TEST 7: Disability Requirement
  const nonDisabledCitizen = {
    ...perfectFarmer,
    disability: false,
  };
  const disabilityPensionScheme = {
    scheme_name: "Divyangjan Swavalamban Yojana",
    state_applicability: ["All"],
    eligibility_rules: { disability_required: true },
  };
  const reasons7 = NonMatchAnalysisService.analyzeNonMatch(nonDisabledCitizen, disabilityPensionScheme);
  assert(
    reasons7.some((r) => r.reasonCode === "DISABILITY_REQUIRED"),
    "Test 7: Non-disabled applicant for PwD scheme triggers DISABILITY_REQUIRED"
  );

  console.log("=================================================");
  console.log("  ALL 7 ELIGIBILITY SUITE TESTS PASSED (100%)    ");
  console.log("=================================================");
}

runTests();
