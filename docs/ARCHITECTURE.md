# SETU AI — SYSTEM ARCHITECTURE SPECIFICATION

## 1. System Overview
**Setu AI** is a production-grade, citizen-centric government welfare discovery, eligibility verification, and application intelligence platform.

The system combines:
1. **Deterministic Multi-State Eligibility Engine**: Hard mathematical evaluation of age, income, state domicile, category quotas, disability, and marital status.
2. **Dense Semantic Retrieval**: Google `text-embedding-004` (768-dim embeddings) coupled with MongoDB Atlas vector search.
3. **Explainable Hybrid Ranking**: Multi-signal scoring combining semantic similarity, regional relevance, category fit, data freshness, and eligibility state.
4. **Grounded AI Explainability**: Gemini 2.5 Flash with XML prompt fencing to eliminate hallucinations and prompt injection vulnerabilities.
5. **Multichannel Delivery**: Web PWA, WhatsApp/SMS, IVR Voice, and Inbound Email.

---

## 2. Architectural Blueprint

```mermaid
graph TD
    subgraph Client ["Client Tier (React 19 + Vite + Tailwind CSS)"]
        Web["Web Application (Code-Split Routes & PWA)"]
        WhatsApp["WhatsApp / SMS / IVR Inbound"]
    end

    subgraph SecurityGateway ["API Gateway & Security Layer"]
        Cors["CORS Whitelist & Helmet HTTP Headers"]
        RateLimit["Sliding-Window Rate Limiting (General: 300/15m, AI: 30/1m)"]
        Auth["JWT Bearer Authentication & RBAC Guards"]
        EnvVal["Zod Strict Environment Validator"]
        ErrNorm["Centralized Error Normalizer"]
    end

    subgraph CoreServices ["Core Services Layer"]
        MatchSvc["Matching & Ranking Engine (matchingService.ts)"]
        DetEngine["Deterministic Eligibility Classifier (NonMatchAnalysisService.ts)"]
        AIOrch["AI Orchestrator (AIOrchestratorService.ts)"]
        DocSvc["Document OCR & Readiness Engine (documentsController.ts)"]
        SimSvc["Life-Event Simulator (simulatorController.ts)"]
    end

    subgraph ExternalServices ["AI & External Providers"]
        Gemini["Google Gemini 2.5 Flash & text-embedding-004"]
        Groq["Groq Llama Fallback"]
        Twilio["Twilio Webhook Gateway"]
    end

    subgraph DataStore ["Data & Persistence Layer"]
        Mongo["MongoDB Atlas (Compound Indexes & Text Search)"]
        Cache["AIResponseCache (SHA-256 Key Hashing)"]
    end

    Web --> SecurityGateway
    WhatsApp --> SecurityGateway
    SecurityGateway --> CoreServices
    CoreServices --> ExternalServices
    CoreServices --> DataStore
```

---

## 3. Core Architectural Invariants
1. **Deterministic Eligibility Over LLM Inference**: Hard constraints (age caps, income limits, state domicile) are computed deterministically in TypeScript. The LLM is **never** permitted to decide boolean eligibility.
2. **Grounded Generation & Injection Fencing**: Prompts are enclosed with strict XML delimiters (`<applicant_profile>`, `<verified_scheme_details>`) preventing user bio inputs from overriding instructions.
3. **Zero-Result Transparency**: If no schemes match, a structured `noResultDiagnosis` is returned explaining exact elimination factors and missing profile attributes.
4. **Resilient Fallbacks & Demo Mode**: AI requests utilize in-memory retries with exponential backoff, Groq fallbacks, and deterministic demo fixtures for high availability.
