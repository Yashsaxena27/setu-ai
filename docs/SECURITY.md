# SETU AI — SECURITY & COMPLIANCE SPECIFICATION

## 1. Security Architecture Summary
Setu AI implements defense-in-depth security across authentication, API transport, rate limiting, and AI prompt isolation.

---

## 2. Implemented Security Controls

### 2.1 Environment Variable Startup Validation
* **Implementation**: `server/src/config/env.ts` with Zod schema validation.
* **Guarantee**: Fails fast or reports structured warnings on invalid/missing secrets during server initialization.

### 2.2 In-Memory Granular Rate Limiting
* **Implementation**: `server/src/middleware/rateLimiter.ts`.
* **General API**: 300 requests per 15-minute window per IP.
* **AI Endpoints (`/match`, `/draft`, `/explain`, `/chat`)**: 30 requests per minute to prevent quota depletion and abuse.

### 2.3 Prompt Injection Defense & Grounding Isolation
* **Implementation**: `server/src/utils/promptSanitizer.ts` and `server/src/services/aiExplanationService.ts`.
* **Controls**:
  * Strips internal database keys (`_id`, `password`, `embedding`, `version_history`).
  * Encloses user inputs and scheme metadata in strict XML tags (`<applicant_profile>` and `<verified_scheme_details>`).
  * Negative constraint prompting prevents models from hallucinating unverified criteria.

### 2.4 Centralized Error Masking
* **Implementation**: `server/src/middleware/errorHandler.ts`.
* **Guarantee**: Stack traces are hidden from clients in production; standardized error envelopes (`{ success: false, message: ... }`) prevent internal database schema leakage.

### 2.5 HTTP Security Headers & CORS
* **Implementation**: `helmet()` and environment-gated `cors({ origin: env.CLIENT_URL, credentials: true })`.
