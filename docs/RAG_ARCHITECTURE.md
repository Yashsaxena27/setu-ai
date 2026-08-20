# SETU AI — RAG ARCHITECTURE SPECIFICATION & COGNITIVE RETRIEVAL ENGINE

## 1. System Pipeline Overview

```mermaid
flowchart TD
    subgraph Client ["Citizen Interface"]
        Input["User Demographics & Query\n(Age, State, Income, Caste, Land, Occupation, Raw Text)"]
    end

    subgraph Step1 ["Stage 1: Semantic Query Synthesis & Dense Embedding"]
        Synth["buildSemanticQuery()\n(Structured Context + Semantic Intent Synthesis)"]
        Embed["Google gemini-embedding-001\n(3,072-dim Normalized Dense Vector)"]
    end

    subgraph Step2 ["Stage 2: Candidate Retrieval & Mode Dispatch"]
        Dispatch{"Atlas $vectorSearch\nAvailable?"}
        AtlasVec["MongoDB Atlas $vectorSearch\n(index: vector_index, dim: 3072, numCandidates: 100, limit: 50)\nretrieval_mode = VECTOR_SEARCH"]
        Fallback["Ranked Lexical & Multi-Attribute Fallback\n(Regex Keyword Boost + State/Occupation Match)\nretrieval_mode = FALLBACK"]
        Dedup["Candidate Deduplication Engine\n(Normalized Name & URL Hash)"]
    end

    subgraph Step3 ["Stage 3: Deterministic Multi-State Eligibility Engine"]
        DetEngine["NonMatchAnalysisService.classifyEligibility()\n- Hard Boundary Verification:\n  * Age Bracket (Min/Max)\n  * State Domicile Quotas\n  * Income Ceilings\n  * Social Category (SC/ST/OBC/EWS) Quotas\n  * Gender & Marital Status\n  * Disability (PwD) Directives"]
        Classify{"Classification"}
        S_Elig["ELIGIBLE\n(Multiplier: 1.0)"]
        S_Act["ACTION_REQUIRED\n(Multiplier: 0.85)"]
        S_Ins["INSUFFICIENT_INFO\n(Multiplier: 0.70)"]
        S_Inel["INELIGIBLE\n(Multiplier: 0.0)"]
    end

    subgraph Step4 ["Stage 4: Explainable Hybrid Scoring & Ranking"]
        Hybrid["FinalScore = round((0.40 * S_sem + 0.25 * S_state + 0.20 * S_cat + 0.15 * S_fresh) * Multiplier * 100)"]
        Rank["Rank Sort: Eligible First -> Highest Final Score"]
    end

    subgraph Step5 ["Stage 5: Grounded AI Explainability & Zero-Result Diagnosis"]
        Gemini["Gemini 2.5 Flash\n(Strict Grounded Prompts with XML Delimiters)"]
        NoRes["Structured No-Result Diagnosis\n(Elimination Factor Counts, Missing Profile Guidance)"]
    end

    Input --> Synth --> Embed --> Dispatch
    Dispatch -->|Yes| AtlasVec --> Dedup
    Dispatch -->|No / Error| Fallback --> Dedup
    Dedup --> DetEngine --> Classify
    Classify --> S_Elig & S_Act & S_Ins & S_Inel
    S_Elig & S_Act & S_Ins & S_Inel --> Hybrid --> Rank
    Rank --> Gemini
    Rank --> NoRes
```

---

## 2. Mathematical Hybrid Ranking Model

Setu AI employs an explainable hybrid ranking score bounded between $0$ and $99$:

$$\text{FinalScore} = \text{round}\left( \left( w_{\text{sem}} S_{\text{sem}} + w_{\text{state}} S_{\text{state}} + w_{\text{cat}} S_{\text{cat}} + w_{\text{fresh}} S_{\text{fresh}} \right) \times M_{\text{elig}} \times 100 \right)$$

### Weights & Signals:
* **$w_{\text{sem}} = 0.40$**: Semantic cosine similarity from vector query embedding (`$meta: "vectorSearchScore"`).
* **$w_{\text{state}} = 0.25$**: Regional relevance ($1.0$ for exact domicile match, $0.90$ for Pan-India, $0.50$ otherwise).
* **$w_{\text{cat}} = 0.20$**: Occupational / Category relevance ($1.0$ for direct match, $0.80$ for general).
* **$w_{\text{fresh}} = 0.15$**: Verification freshness ($1.0$ for verified/fresh, $0.70$ for stale).
* **$M_{\text{elig}}$ (Eligibility Multiplier)**:
  * **$\text{ELIGIBLE}$**: $1.0$
  * **$\text{ACTION\_REQUIRED}$**: $0.85$
  * **$\text{INSUFFICIENT\_INFORMATION}$**: $0.70$
  * **$\text{POTENTIAL\_MATCH}$**: $0.60$
  * **$\text{INELIGIBLE}$**: $0.00$

*Guarantee: An ineligible scheme receives $M_{\text{elig}} = 0.0$ and is filtered completely out of the recommended match pool.*

---

## 3. Five Granular Eligibility States

1. **`ELIGIBLE`**: All demographic criteria (Age, State, Income, Caste, Gender, Land, Disability, Marital Status) are satisfied.
2. **`ACTION_REQUIRED`**: Citizen qualifies in principle, but must complete a specific action item (e.g. upload caste certificate or self-declaration).
3. **`INSUFFICIENT_INFORMATION`**: Critical fields (such as state of domicile or income) were omitted by the citizen.
4. **`POTENTIAL_MATCH`**: Citizen partially aligns with discretionary scheme criteria.
5. **`INELIGIBLE`**: Citizen strictly violates one or more hard mathematical criteria.

---

## 4. Grounding & Anti-Hallucination Invariants
1. **Zero LLM Overrides**: The LLM is never invoked to decide boolean eligibility.
2. **Prompt XML Delimiters**: Inputs are enclosed in `<applicant_profile>` and `<verified_scheme_details>` tags to neutralize prompt injections.
3. **Negative Constraint Prompting**: If a detail is missing from official scheme records, the model outputs: *"Information not available in verified scheme data."*
