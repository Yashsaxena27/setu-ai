# SETU AI — SYSTEM ARCHITECTURE SPECIFICATION

## 1. System Overview
**Setu AI** is an intelligent, multilingual welfare discovery and application platform that bridges the gap between Indian citizens and government welfare schemes.

The platform employs a **Two-Tier Grounded Hybrid RAG Architecture** that combines:
1. **Deterministic Rule Filtering** (Age, State, Income, Caste, Gender, Landholdings, Disability, Marital Status).
2. **Semantic Vector Ranking & Explainability** powered by Google Gemini and dense vector representations.

---

## 2. Architectural Blueprint

```
+-------------------------------------------------------------------------------+
|                       CLIENT TIER (React 18 + Vite + PWA)                     |
|  - Demographic Profile Wizard     - Multi-Step Draft Application & PDF Export |
|  - AI Matching & Comparison Grid  - Offline Caching via LocalStorage          |
+-------------------------------------------------------------------------------+
                                      |
                                      v (HTTP / JSON - Bearer JWT)
+-------------------------------------------------------------------------------+
|                   EXPRESS API GATEWAY & SECURITY MIDDLEWARE                   |
|  - Strict CORS Policy             - In-Memory Rate Limiting (General & AI)    |
|  - Helmet HTTP Security Headers   - Centralized Error Normalizer Envelope     |
|  - Zod Startup Env Validation     - Twilio/WhatsApp Webhook Handler           |
+-------------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
+-------------------------------+                         +-----------------------------+
|    AUTH & USER CONTROLLERS    |                         |  SCHEME MATCHING & RAG SVC  |
|  - JWT Authentication         |                         |  - NonMatchAnalysisService  |
|  - Profile & Family Records   |                         |  - AIOrchestratorService    |
+-------------------------------+                         |  - Gemini 2.5 Structured AI |
                                                          +-----------------------------+
                                                                         |
                                                                         v
+-------------------------------------------------------------------------------+
|                    DATA, VECTOR & BACKGROUND JOB LAYER                        |
|  - MongoDB Atlas (Compound Indexes on state_applicability, is_active, category)|
|  - AIResponseCache (SHA-256 Request Cache with In-Memory Retry Queue)         |
|  - Node-Cron Scheduler (Periodic Scheme Updates & Reminders)                  |
+-------------------------------------------------------------------------------+
```

---

## 3. Core Architectural Invariants
1. **Deterministic Eligibility Over LLM Guessing**: Hard eligibility rules (age, income ceiling, state boundary, caste quota) are evaluated in code by `NonMatchAnalysisService`. The LLM is never permitted to override a deterministic eligibility failure.
2. **Grounded AI Generation**: Prompts are delimited with `<applicant_profile>` and `<verified_scheme_details>` tags, instructing the model to rely solely on verified scheme metadata and never hallucinate monetary benefits or official URLs.
3. **Fail-Safe Operation & Demo Mode**: The AI Orchestrator includes in-memory retry queues with exponential backoff, Groq fallback capabilities, and offline demo fixtures (`DEMO_MODE=true`) for uninterrupted hackathon demonstrations.
