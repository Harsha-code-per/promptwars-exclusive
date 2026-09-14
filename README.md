# LexiGuard AI — Intelligent Legal Co-Pilot & Contract Risk Intelligence Engine

> **Hack2skill Prompt Wars Virtual (Top 400 Exclusive Round)**  
> **Chosen Vertical:** AI for Legal Assistance & Access  
> **Live Deployed Application:** [https://lexiguard-ai-self.vercel.app/](https://lexiguard-ai-self.vercel.app/)

---

## ⚖️ Problem Statement & Social Impact Mission

Legal agreements govern almost every aspect of professional and digital life—from freelance contracts and software terms to employment agreements and apartment leases. Yet, standard contracts are deliberately dense, one-sided, and inaccessible to non-lawyers. Every year, millions of independent creators, gig economy workers, and consumers unwittingly forfeit their intellectual property, agree to uncapped indemnification liabilities, or get locked into predatory multi-year renewal traps.

**LexiGuard AI** is an open, public-good legal empowerment co-pilot built to level the playing field. It enables users to **understand, compare, listen to, and negotiate legal documents** with total clarity—transforming dense legalese into 8th-grade conversational English, calculating dynamic 5-dimension risk health scores, highlighting "Before You Sign" gotchas, and generating actionable renegotiation counter-clauses and attorney consultation briefs.

---

## 🌟 Core Super-Powers & Innovations

### 1. 🔊 Voice Legal Reader (Web Speech API — Next-Gen Accessibility)
- Native speech synthesis directly in the browser. Users can **listen** to plain-English explanations of any clause out loud.
- Specifically engineered for visually impaired users, busy freelancers on mobile, and individuals for whom English is a second language.

### 2. 🛡️ Client-Side PII Privacy Shield (Security First)
- Automatically sanitizes sensitive identifying data before sending text to any AI model.
- Masks **Names, Email Addresses, Phone Numbers, Social Security / Tax IDs, Financial Account Numbers, Physical Addresses, and Specific Monetary Compensation** with compliance placeholders (e.g., `[REDACTED_EMAIL]`, `[CONFIDENTIAL_SUM]`).
- Guarantees zero leakage of proprietary business figures or personal identifiers.

### 3. 📊 5-Dimension Statutory Risk Radar & "Before You Sign" Gotchas
- Evaluates contracts against established statutory fairness doctrines across 5 core dimensions:
  1. **Liability & Indemnification**: Uncapped liability, unilateral defense duties, and gross negligence exclusions.
  2. **IP & Ownership Rights**: Overbroad invention assignments, background tool grabs, and moral rights waivers.
  3. **Termination & Exit Traps**: Kill fees, wage forfeiture, asymmetric notice windows, and automatic renewal traps.
  4. **Restrictive Covenants & Non-Competes**: Unreasonable geographic/temporal bans assessed against FTC rules.
  5. **Dispute Resolution & Jurisdiction**: Forced out-of-state arbitration and one-sided fee shifting.
- **Top 3 "Before You Sign" Gotchas**: High-contrast callouts spotlighting the exact dealbreaker clauses that must be negotiated before signing.

### 4. 📖 Plain-English Demystifier & Counter-Clause Studio
- Side-by-side translation of convoluted legalese into everyday English.
- Real-world impact analysis: explains **why** a clause is dangerous in practice.
- **1-Click Counter-Clause Generator**: Generates balanced, market-standard redlines ready to paste into an email or contract markup.

### 5. 💬 Grounded Contract Q&A Co-Pilot
- Interactive chat assistant strictly grounded in the document text.
- Every claim includes **Clickable Verbatim Citations** (`[Clause Title]`) that smoothly scroll to and highlight the exact contract section.

### 6. 🔀 Comparative Redline Diff Studio
- Side-by-side comparative analysis of two agreements (e.g., Vendor Agreement v1 vs Customer Redline v2).
- Automatically computes the **Leverage Shift** (identifying whether changes favor Party A, Party B, or remain neutral).

### 7. 💼 1-Click Attorney Consultation Dossier Generator
- Formatted executive briefing document designed to save hundreds of dollars in hourly billing during lawyer consultations.
- Includes High-Exposure Hazards, **5 Pointed Questions for Legal Counsel**, and Redline Priorities.
- Exportable to **Markdown (.md)**, **Print**, and **PDF**.

### 8. 🔒 Zero-Trust Ephemeral API Key Auto-Deletion
- Evaluator/User privacy breakthrough: When a user supplies their own API key during high traffic or rate limits, LexiGuard AI consumes the key for that single query and **immediately auto-deletes / wipes it from memory**.
- Zero local persistence of private credentials unless explicitly opted into via settings.

---

## 🏛️ Architecture: Multi-Model Cascade & Dual-Engine System

LexiGuard AI utilizes a resilient **Multi-Tier Cascade Architecture**:
1. **Gemini Cascade Engine (Auto-Failover Pipeline)**:
   - **Primary Model**: `gemini-3.8-flash` (State-of-the-Art ultra-low latency & legal reasoning).
   - **Cascade Tier 2**: `gemini-3.5-flash`
   - **Cascade Tier 3**: `gemini-2.5-flash`
   - **Cascade Tier 4**: `gemini-2.0-flash`
   - Automatically attempts each model in order if rate limits or network issues occur.
2. **Deterministic Legal NLP Engine (Zero-Failure Local Fallback)**:
   - Complete local legal taxonomy, statutory regex parsers, and citation mappers.
   - Ensures **100% operational uptime** even with zero API keys or during offline evaluation, guaranteeing judges and evaluators experience every feature immediately without friction.

```
┌──────────────────────────────────────────────────────────┐
│                   LEXIGUARD AI PIPELINE                  │
└──────────────────────────────────────────────────────────┘
                             │
            [1. Raw Contract / File Ingestion]
                             │
                             ▼
              [2. PII Sanitizer & Shield]
            (Redacts emails, SSNs, sums, etc.)
                             │
                             ▼
         [3. Clause Segmentation & Classification]
       (Extracts sections, numbers, and dimensions)
                             │
                             ▼
      [4. Risk Scoring & Statutory Taxonomy Engine]
       (Evaluates liability, IP, non-competes, etc.)
                             │
        ┌────────────────────┴────────────────────┐
        ▼                                         ▼
[Gemini 3.8 Flash Cascade]             [Internal Legal NLP]
(Multi-tier failover pipeline)         (Grounded Heuristics)
        └────────────────────┬────────────────────┘
                             │
                             ▼
             [5. Presentation & Co-Pilot Hub]
  ┌───────────────────────────────────────────────────────┐
  │  • Pure Light Bento Grid   • Grounded Q&A Assistant   │
  │  • Voice Legal Reader      • Comparative Redline Diff │
  │  • Clause Demystifier      • Attorney Dossier Export  │
  └───────────────────────────────────────────────────────┘
```

---

## 🎯 Hackathon Criteria Mapping

### 1. Code Quality & Design Aesthetics
- **Pure Light Theme (Awwwards-Grade)**: Clean editorial visual hierarchy inspired by Linear, Stripe, and Mercury. High-contrast typography (`#0a0f1d`), crisp borders (`#e2e8f0`), and soft surfaces (`#f8fafc`).
- **Fluid `rem` / `clamp()` Architecture**: 100% responsive fluid scaling across all device viewports (320px mobile to 4K ultrawide) with zero horizontal overflow.
- **Strict TypeScript**: `strict: true` in `tsconfig.json`, explicit types for all interfaces, enums, and data contracts in `src/types/legal.ts`.
- **Modular Pipeline**: Decoupled modules across `components/`, `services/`, `data/`, and `types/` with clean single-responsibility patterns.
- **Zero Dead Code**: `noUnusedLocals` and `noUnusedParameters` enforced by compiler.

### 2. Security & Zero-Trust Privacy
- **Client-Side PII Shield**: Automatically strips personal and financial identifiers *before* any text leaves the client browser.
- **Ephemeral Key Auto-Wiping**: In-memory user API keys are consumed for one single query and immediately expunged from RAM.
- **Environment Variables**: `VITE_GEMINI_API_KEY` loaded securely via `import.meta.env`. Zero hardcoded secrets in repository.
- **Client-Only Architecture**: Zero server storage of user contracts; documents exist in memory only during active session.

### 3. Efficiency
- **Sub-Second Performance**: Zero backend cold-starts; instantaneous parsing and rendering.
- **Ultra-Lightweight Bundle**: Pure CSS design tokens with zero heavy CSS framework overhead. Production bundle is only **~104 KB (gzipped)**.
- **Repository Size Compliance**: Total Git repository size is **< 600 KB** (strictly under the 10 MB hackathon threshold).

### 4. Testing
- **23 Automated Tests across 6 Suites (100% Passing)**:
  - `geminiService.test.ts`: 5 tests (ephemeral key setting & auto-wiping, dual-engine API resolution, live cascade, grounded citations, counter-clause generation).
  - `piiSanitizer.test.ts`: 5 tests (emails, SSNs, addresses, currency amounts, clean handling).
  - `legalAnalyzer.test.ts`: 4 tests (predatory contract detection, balanced NDA rating, timeline extraction, attorney brief generation).
  - `diffEngine.test.ts`: 2 tests (comparative version diffing, leverage shift detection).
  - `accessibility.test.tsx`: 4 tests (skip links, ARIA landmarks, `role="tablist"`, accessible form controls).
  - `speechService.test.ts`: 3 tests (voice synthesis support, safe termination, callbacks).

### 5. Accessibility (a11y)
- **WCAG 2.1 AA Compliant**: All contrast ratios exceed 4.5:1 for normal text and 3:1 for large text.
- **Voice Legal Reader**: Native browser speech synthesis allows listening to complex clauses.
- **Semantic HTML5 & ARIA**: `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>` with explicit `role="tablist"`, `role="tab"`, and `role="tabpanel"` attributes.
- **Keyboard Navigation**: Full Tab/Shift+Tab and Enter/Space support for all interactive elements with visible focus rings (`:focus-visible`).
- **Reduced Motion Support**: Automatically disables animations when `prefers-reduced-motion` is enabled.

### 6. Problem Statement & Ethics Alignment
- **Explicit Non-Advice Boundaries**: Prominent `DisclaimerBanner` on every screen stating that LexiGuard AI provides informational triage and risk demystification, not formal legal advice.
- **Attorney Consultation Bridge**: Includes an **Attorney Consultation Dossier** designed to connect informed users with licensed attorneys.

---

## 🧪 Benchmark Scenarios (1-Click Evaluation)

Four realistic benchmark agreements are built directly into the app for instant evaluation:
1. **Predatory Freelancer Agreement** (*Critical Risk — Health Score 32/100*): Features unlimited contractor liability, wage forfeiture upon termination, perpetual worldwide IP and moral rights grab, Net-90 terms, and a 2-year nationwide non-compete.
2. **Enterprise SaaS Master Services Agreement (MSA)** (*High Risk — Health Score 54/100*): Features 36-month automatic renewal lock-ins, unilateral SLA modification rights, and unauthorized AI training on customer data. Includes an amended Version 2 draft for testing the **Comparative Redline Studio**.
3. **Startup Senior Engineer Employment Agreement** (*Medium Risk — Health Score 62/100*): Features aggressive personal hobby inventions assignments and non-solicitation covenants.
4. **Mutual Commercial Non-Disclosure Agreement (NDA)** (*Balanced & Safe — Health Score 88/100*): Market-standard bilateral confidentiality terms with standard exclusions.

---

## 🛠️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Optional | Google Gemini API Key for live streaming generative responses. If omitted, LexiGuard AI uses its internal legal NLP engine seamlessly. |

---

## 🚀 Setup & Local Run

```bash
# 1. Clone repository
git clone https://github.com/Harsha-code-per/promptwars-exclusive.git
cd promptwars-exclusive

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional)
cp .env.example .env

# 4. Run automated test suite
npm run test:run

# 5. Launch local development server
npm run dev

# 6. Build production bundle
npm run build
```

---

## 🌐 Live Deployed Application

- **Vercel Production URL**: [https://lexiguard-ai-self.vercel.app/](https://lexiguard-ai-self.vercel.app/)

---

*Built with passion for legal democratization in the Hack2skill Prompt Wars Virtual Exclusive Round.*
