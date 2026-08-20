# SETU AI — RAG EVALUATION & VERIFICATION MATRIX

## 1. Evaluation Objectives
The Setu AI Retrieval-Augmented Generation (RAG) pipeline is tested against critical real-world welfare scenarios to guarantee zero false positives on state boundaries, income caps, and demographic restrictions.

---

## 2. Test Scenarios & Grounded Results

| Test ID | Scenario Description | Citizen Profile Parameters | Target Scheme | Expected Deterministic Output | Grounded AI Status | Test Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **RAG-01** | Perfect Farmer Match | 45y, Female, UP, Income ₹1.2L, Farmer, OBC | PM Kisan Samman Nidhi | `reasons.length === 0` (Eligible) | `ELIGIBLE` with ₹6,000/yr DBT explanation | ✅ **PASSED** |
| **RAG-02** | Income Ceiling Violation | 45y, UP, Income ₹5.0L, Farmer | PM Kisan Samman Nidhi | `INCOME_LIMIT_EXCEEDED` (Limit: ₹2.0L) | Filtered to Non-Matches | ✅ **PASSED** |
| **RAG-03** | State Domicile Restriction | 22y, Bihar, Student, Income ₹1.0L | Majhi Kanya Bhagyashree (Maharashtra) | `STATE_RESTRICTED` (MH only) | Filtered to Non-Matches | ✅ **PASSED** |
| **RAG-04** | Minimum Age Restriction | 15y, UP, Income ₹80k | PM Shram Yogi Maandhan (18-40y) | `AGE_MISMATCH` (Min: 18y) | Filtered to Non-Matches | ✅ **PASSED** |
| **RAG-05** | Occupation Restriction | 21y, UP, Student, Income ₹1.5L | PM Kisan Samman Nidhi (Farmer only) | `OCCUPATION_MISMATCH` | Filtered to Non-Matches | ✅ **PASSED** |
| **RAG-06** | Social Category Quota | 28y, General, Income ₹1.0L | Post Matric Scholarship for ST | `CASTE_MISMATCH` (ST only) | Filtered to Non-Matches | ✅ **PASSED** |
| **RAG-07** | Disability Criteria | 34y, UP, No disability declared | Divyangjan Swavalamban Yojana | `DISABILITY_REQUIRED` | Filtered to Non-Matches | ✅ **PASSED** |

---

## 3. How to Run RAG Evaluation Tests
To execute the automated evaluation suite:
```bash
cd server
npm test
```
Result: **7 of 7 test cases passed with 100% deterministic compliance.**
