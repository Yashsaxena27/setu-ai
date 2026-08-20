# SETU AI — SECURITY & GOVERNANCE SPECIFICATION

## 1. Authentication & Session Security
* **JSON Web Tokens (JWT)**: Signed with `HS256` using secure `JWT_SECRET`, expiring after 24 hours.
* **Role-Based Access Control (RBAC)**: Dedicated `adminMiddleware` protecting administrative routes (`/admin/*`). Regular profile update endpoints strip unauthorized `role` elevation parameters.
* **Password Hashing**: Bcrypt with work factor 10.

---

## 2. API Gateway & Network Protections
* **CORS Policy**: Configured via `CLIENT_URL` whitelist with credential support.
* **Helmet Security Headers**: Enables `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, and removes `X-Powered-By`.
* **Rate Limiting**:
  * General endpoints: 300 requests per 15-minute window per IP.
  * AI/LLM endpoints (`/match`, `/draft`, `/explain`, `/chat`, `/simulator`): 30 requests per minute.
* **Payload Size Limits**: Strict 15MB JSON payload caps to prevent memory exhaustion.

---

## 3. Prompt Injection Defenses
* **XML Boundary Enclosures**: All dynamic inputs from citizens are enclosed in `<applicant_profile>` tags.
* **System Delimiters**: Instructions are clearly partitioned from unverified applicant text.
* **Negative Constraint Prompting**: Prompts forbid the model from hallucinating schemes or claiming eligibility when criteria are absent from `<verified_scheme_details>`.

---

## 4. File Upload & Document Security
* **Allowed MIME Types**: Whitelist restricted to `application/pdf`, `image/jpeg`, and `image/png`.
* **Base64 Validation**: Regex pattern checks and 8MB byte size limits prior to memory buffer decoding.
* **User Isolation**: All file and document records enforce `user_id: req.userId` queries.
