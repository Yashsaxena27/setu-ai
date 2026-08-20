# SETU AI — TESTING & QUALITY ASSURANCE SPECIFICATION

## 1. Automated Test Suites Overview

Setu AI features **80 automated backend tests** validating the deterministic eligibility engine, boundary conditions, and RAG evaluation scenarios.

```bash
cd server
npm test
```

This single command runs:
1. `src/scripts/testEligibilityEngine.ts`: **50 deterministic boundary & edge tests**.
2. `src/scripts/runRagEvaluation.ts`: **30 comprehensive citizen evaluation cases**.

---

## 2. Test Coverage Matrix

### 50-Case Deterministic Test Suite (`testEligibilityEngine.ts`)
| Category | Cases | Status |
| :--- | :---: | :---: |
| **Age Boundaries** (Min age - 1, Min age, Max age, Max age + 1, Missing age) | 5 | ✅ PASSED (100%) |
| **Income Boundaries** (₹1.99L, ₹2.00L, ₹2.00001L, ₹0 BPL, ₹10L) | 5 | ✅ PASSED (100%) |
| **State & Domicile** (Exact, Lowercase, Out-of-state, Pan-India, Missing) | 6 | ✅ PASSED (100%) |
| **Gender Requirements** (Female-exclusive, Male, Any, Missing) | 5 | ✅ PASSED (100%) |
| **Caste / Quotas** (SC, ST, OBC, EWS, General, Missing) | 5 | ✅ PASSED (100%) |
| **Disability Status** (True, False, String 'Yes', String 'No', Undefined) | 5 | ✅ PASSED (100%) |
| **Marital Status** (Widow, Married, Unmarried, Divorced, Missing) | 5 | ✅ PASSED (100%) |
| **Occupation Rules** (Farmer, Hinglish Kisan, Student, Artisan, Business, Citizen) | 7 | ✅ PASSED (100%) |
| **Complex Multi-Rule Scenarios** | 4 | ✅ PASSED (100%) |
| **Adversarial & String Parsing Cases** | 3 | ✅ PASSED (100%) |
| **Total** | **50** | **100% Pass Rate** |

---

### 30-Case RAG Evaluation Suite (`runRagEvaluation.ts`)
* **30 Curated Real-World Citizen Scenarios** (`docs/rag-evaluation-cases.json`).
* **Pass Rate**: **30 / 30 (100%)**.
* **Deterministic Classification Precision**: **100%**.
* **Deterministic Classification Recall**: **100%**.
* **False Positive Rate**: **0%**.
* **False Negative Rate**: **0%**.
