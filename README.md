<div align="center">
  <img src="https://raw.githubusercontent.com/yashsaxena27/setu-ai/main/client/public/vite.svg" alt="Setu AI Logo" width="80" height="80" />
  <h1>Setu AI — सेतु AI</h1>
  <p><strong>AI-Powered Government Welfare Discovery & Application Platform for India</strong></p>
  <br />

  <p>
    <a href="https://setu-ai-six.vercel.app"><img src="https://img.shields.io/badge/Live_App-setu--ai--six.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  </p>

  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square" alt="React" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white&style=flat-square" alt="Node.js" /></a>
    <a href="https://www.mongodb.com/atlas"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white&style=flat-square" alt="MongoDB" /></a>
    <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google&logoColor=white&style=flat-square" alt="Google Gemini" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css&logoColor=white&style=flat-square" alt="TailwindCSS" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" /></a>
  </p>
</div>

<br />

> **Setu** (सेतु) means "bridge" in Sanskrit. This platform bridges the gap between India's complex government welfare system and the citizens who need it most.

---

## Table of Contents

- [What is Setu AI?](#what-is-setu-ai)
- [The Problem](#the-problem)
- [How It Works](#how-it-works)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Mode](#demo-mode)
- [Multi-Channel Access](#multi-channel-access)
- [Security & Privacy](#security--privacy)
- [Future Roadmap](#future-roadmap)
- [Creator](#creator)
- [License](#license)

---

## What is Setu AI?

Setu AI is a full-stack civic-tech platform that helps Indian citizens discover, understand, and apply for government welfare schemes they are eligible for.

It uses a **Hybrid Retrieval-Augmented Generation (RAG)** engine — combining semantic AI search with strict rule-based filters — to match citizen profiles against **86+ central and state government schemes**. The platform guarantees zero hallucinated eligibility by layering deterministic constraint checks (age, income, state, occupation) on top of AI-powered semantic matching.

Beyond matching, Setu AI provides an end-to-end application journey: document verification via AI-powered OCR, a personalized 8-step roadmap, auto-generated application drafts, and multi-channel access through WhatsApp, SMS, Voice IVR, and Email.

**Hackathon**: Lenovo Leap Hackathon 2026 — Civic-Tech & AI Track  
**Creator**: Yash Saxena

---

## The Problem

Over **₹2 lakh crore** in annual government welfare allocations go unclaimed in India. Three barriers cause this:

1. **Information Fragmentation** — Eligibility criteria are scattered across 500+ state and central government portals with no unified discovery tool.
2. **Jargon Barrier** — Scheme guidelines are written in complex bureaucratic language that most citizens cannot parse.
3. **Application Drop-off** — Even after finding a relevant scheme, citizens struggle with document preparation, miss deadlines, and don't know which local office to visit.

Setu AI solves all three.

---

## How It Works

The platform uses a 4-stage pipeline to ensure accurate, trustworthy scheme matching:

```
Citizen Profile Input
        │
        ▼
┌─────────────────────────────────┐
│  Stage 1: Semantic Embedding    │   Google Gemini text-embedding-004
│  768-dim vector from profile    │   converts profile into a vector
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  Stage 2: Vector Search         │   MongoDB Atlas $vectorSearch finds
│  Retrieve candidate schemes     │   semantically similar schemes
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  Stage 3: Constraint Filtering  │   Hard rules (age, income, state,
│  Eliminate ineligible matches   │   occupation) remove false positives
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  Stage 4: AI Explanation        │   Gemini 2.5 Flash generates plain-
│  Generate match rationale       │   language reasoning for each match
└─────────────────────────────────┘
```

This architecture ensures **the AI never tells a citizen they qualify for something they don't**. The deterministic filter layer acts as a hard guardrail against LLM hallucination.

---

## Features

### Core Matching & Discovery

| Feature | What It Does |
|---|---|
| **Hybrid RAG Matching** | Combines vector similarity search with strict rule-based filters across 86+ schemes. AI finds relevant schemes; deterministic rules guarantee accuracy. |
| **Explainable AI** | Every match comes with a plain-language explanation of *why* the citizen qualifies — no black-box outputs. |
| **Benefit Gap Calculator** | Shows citizens how much unclaimed welfare money they're leaving on the table (potential vs. already receiving vs. missing). |
| **Scheme Comparison** | Side-by-side comparison matrix of any two schemes across benefits, eligibility, documents, and portals. |

### Profile & Documents

| Feature | What It Does |
|---|---|
| **DigiLocker Auto-Profile** | Simulates DigiLocker OAuth to auto-extract citizen data from Aadhaar/PAN, with smart diff-merge to fill profile gaps. |
| **Multimodal Document Verification** | Gemini Vision OCR extracts text from uploaded documents, validates name matching, checks image quality, detects expiration, and scores document readiness. |
| **5-Dimensional Success Score** | Weighted readiness score across Eligibility (40%), Documents (30%), Profile (15%), Verification (10%), and Draft (5%) — tells citizens exactly how ready they are to apply. |

### Application Journey

| Feature | What It Does |
|---|---|
| **8-Step Application Roadmap** | Interactive step-by-step guide from profile creation to benefit receipt. Tracks progress, estimates time, and links to relevant portals. |
| **Application Draft Generator** | AI generates a pre-filled, formal government application letter ready for submission. Exportable as A4 PDF. |
| **Nearby Help Panel** | Shows the nearest Common Service Centre (CSC), Krishi Bhavan, or District Office based on the citizen's location. |
| **Deadline Reminders** | Personal reminder system for application deadlines, document renewal dates, and status check-ins. |

### Household & Simulation

| Feature | What It Does |
|---|---|
| **Household Scheme Intelligence** | Add family members (spouse, parents, children, dependents) and run collective welfare analysis. Detects when multiple members apply for conflicting or duplicate schemes. |
| **Eligibility Simulator** | Sandbox for "what-if" scenarios — change income, state, occupation, or age to see how eligibility shifts in real-time without affecting the actual profile. |

### Communication & Accessibility

| Feature | What It Does |
|---|---|
| **Grounded AI Copilot** | Conversational assistant powered by RAG. Answers questions about schemes with source citations and explainability logs. Supports voice input via Web Speech API. |
| **Scheme Change Tracker** | Monitors policy updates (income limit changes, eligibility expansions, deadline extensions) and notifies affected citizens with visual diffs of what changed. |
| **Voice Input** | Browser-based speech recognition in Hindi and English for hands-free profile input and chat interaction. |

### Administration

| Feature | What It Does |
|---|---|
| **Government Admin Portal** | Full admin dashboard with 6-tier RBAC (Citizen → Moderator → Scheme Editor → District Admin → State Admin → Super Admin). Supports scheme CRUD, broadcast notifications, welfare analytics, user management, and immutable audit logs. |
| **Demo Mode** | One-click preset loader using a realistic persona (Kamla Devi — 45-year-old farmer from Uttar Pradesh) for instant demonstrations. |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript 5 | Type safety |
| Vite 8 | Build tooling & dev server |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations & page transitions |
| html2canvas + jsPDF | Client-side A4 PDF export |
| React Router v7 | Routing & navigation |

### Backend
| Technology | Purpose |
|---|---|
| Node.js 20 | Runtime |
| Express.js 5 | REST API framework |
| TypeScript | Type safety |
| MongoDB Atlas + Mongoose | Database with `$vectorSearch` (768-dim) |
| Google Gemini 2.5 Flash | LLM for explanations, drafts, OCR, chat |
| Google Gemini text-embedding-004 | 768-dimensional vector embeddings |
| Twilio | WhatsApp, SMS, and Voice IVR channels |
| Nodemailer | Email communication channel |
| JWT + Bcrypt | Authentication & password hashing |
| Helmet + CORS | HTTP security headers |

### Infrastructure
| Technology | Purpose |
|---|---|
| Vercel | Frontend hosting |
| MongoDB Atlas | Cloud database with vector search index |
| Google AI Studio | Gemini API provider |

---

## Project Structure

```
setu-ai/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── auth/                # ProtectedRoute, AdminRoute
│   │   │   ├── effects/             # CustomCursor, ScrollProgress
│   │   │   ├── ui/                  # CommandPalette, ErrorBoundary, OfflineBanner
│   │   │   └── widgets/             # WhatsAppWidget
│   │   ├── context/                 # AuthContext, DemoModeContext
│   │   ├── hooks/                   # useVoiceInput
│   │   ├── pages/                   # 20 page components
│   │   ├── router/                  # AppRouter with role-based guards
│   │   └── services/               # API client functions
│   └── public/                      # Static assets
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── adapters/                # Channel adapters (WhatsApp, SMS, Voice, Email)
│   │   ├── controllers/             # 19 route controllers
│   │   ├── middleware/              # Auth & Admin RBAC middleware
│   │   ├── models/                  # 18 Mongoose data models
│   │   ├── routes/                  # Express route definitions
│   │   ├── services/               # 14 business logic services
│   │   ├── scripts/                # Seeding & embedding generation
│   │   ├── data/                   # Scheme dataset (86 schemes)
│   │   └── config/                 # Database connection
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **MongoDB Atlas** account (with vector search index configured)
- **Google AI Studio** API key (for Gemini access)
- **Twilio** account (optional — for WhatsApp, SMS, and Voice channels)

### 1. Clone the Repository

```bash
git clone https://github.com/yashsaxena27/setu-ai.git
cd setu-ai
```

### 2. Install Dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 3. Configure Environment Variables

**`server/.env`**
```env
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_google_gemini_api_key

# Optional: Twilio (WhatsApp, SMS, Voice)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Optional: Email (SMTP)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=welfare@setu-ai.org

# Optional: Demo mode (bypasses Gemini API calls)
DEMO_MODE=true
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:5000
```

### 4. Seed the Database & Start

```bash
# Terminal 1 — Backend
cd server
npm run seed           # Loads 86 government schemes into MongoDB
npm run embeddings     # Generates 768-dim vector embeddings for each scheme
npm run dev            # Starts the Express server on port 5001

# Terminal 2 — Frontend
cd client
npm run dev            # Starts the Vite dev server on port 5173
```

Open **http://localhost:5173** in your browser.

> **Tip:** Set `DEMO_MODE=true` in `server/.env` to run locally without a Gemini API key. The app will use pre-computed fixture responses instead of live AI calls.

---

## Demo Mode

Setu AI includes a **one-click Demo Mode** designed for quick presentations:

1. Open the app (live or local)
2. Click **"Quick Demo Mode (Kamla Devi)"** on the landing page
3. The app instantly loads a realistic preset profile:
   - **Kamla Devi** — 45-year-old female farmer from Pratapgarh, Uttar Pradesh
   - Annual income: ₹1,20,000
   - Pre-matched against 86 schemes with scores, success metrics, and AI explanations
4. From here you can explore every feature: matched schemes, benefit gap, document verification, roadmap, family analysis, AI copilot, admin portal, and more

No account creation or API calls required — everything runs on cached fixture data.

---

## Multi-Channel Access

Setu AI is not just a web app. Citizens can interact through four communication channels, all powered by a unified backend pipeline:

| Channel | How It Works |
|---|---|
| **WhatsApp** | Citizens text their profile details to a Twilio sandbox number. The system parses the message, runs the matching engine, and replies with top scheme matches formatted for WhatsApp. |
| **SMS** | Same pipeline over SMS. Character-optimized responses with top 2 matches and direct links. |
| **Voice IVR** | Citizens call a Twilio number. An interactive voice menu (Indian English, Google Wavenet) prompts them to speak their details. Speech is converted to text, processed through the pipeline, and results are spoken back. |
| **Email** | Inbound email webhook parses profile details from the email body, runs matching, and sends a formatted response email with matched schemes. |

All four channels feed into the same matching engine and log every interaction in `CommunicationLog` for analytics.

---

## Security & Privacy

| Measure | Implementation |
|---|---|
| **Authentication** | JWT-based token authentication with Bcrypt password hashing |
| **Role-Based Access Control** | 6-tier RBAC hierarchy: Citizen → Moderator → Scheme Editor → District Admin → State Admin → Super Admin |
| **Admin Route Protection** | Backend middleware (`verifyAdmin`) and frontend route guards (`AdminRoute`) enforce role checks on every admin endpoint and page |
| **Immutable Audit Logs** | Every admin action (scheme edits, broadcasts, exports) is recorded with timestamp, actor, target, and IP address |
| **DPDP Compliance** | Explicit consent capture with timestamp, data minimization, right to permanent account deletion (hard delete), and sandboxed LLM prompts that strip personal identifiers |
| **Upload Validation** | File size limits (8MB), MIME type allowlisting (PDF, JPEG, PNG only), base64 format validation, and executable/script rejection |
| **HTTP Security** | Helmet headers, CORS origin restriction, and secure cookie handling |

---

## Future Roadmap

- **Live India Stack Integration** — Connect to official DigiLocker, Aadhaar eKYC, and UMANG APIs for real document verification
- **Vernacular Voice Agent** — Offline-capable speech recognition in 12+ regional Indian languages
- **Civic Analytics Dashboard** — District Magistrate-facing portal for tracking unmet welfare demand at the tehsil level
- **SMS/USSD Fallback** — Scheme matching for feature phone users in deep rural areas without internet access
- **Mobile App** — Native Android app with offline-first architecture for low-connectivity regions

---

## Creator

Built for **Lenovo Leap Hackathon 2026** by:

- **Yash Saxena** — [LinkedIn](https://www.linkedin.com/in/yash-saxena-21490a308/)

---

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE) for details.
