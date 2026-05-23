# Zawadi Scholarship Portal

A full-stack scholarship portal for African applicants tracking undergraduate, master's, PhD, fellowship and foundation opportunities — now with AI-powered document intelligence, auto-apply, and personalized essay generation.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Admin console: `http://localhost:5173/admin`

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `INGEST_API_KEY` in `.env` before production. In local development, the fallback admin login is `admin@zawadi.app` with password `zawadi-admin-2026`.

## 🧠 AI Features

### 1. Document Intelligence
- **Auto-detects document types** regardless of naming conventions or country-specific formats
- Recognizes: CV, Transcript, Passport, National ID, Essay, Motivation Letter, Statement of Purpose, References, Certificates, Admission Letters, Financial Evidence
- Two-layer detection: heuristic analysis + AI-powered classification (when configured)
- Color-coded confidence scores on every document

### 2. Auto-Apply Engine
- **Fills scholarship application forms automatically** using your profile and documents
- When fields can't be filled → saves as **draft** with specific alerts
- **Batch auto-apply**: select multiple scholarships, apply to all at once
- Every draft shows exactly what's missing and how to fix it
- Full transparency: every filled field is visible, nothing is hidden

### 3. 3-Stage Essay Generator (DeepSeek-powered)
- **Stage 1**: Generates first draft from your writing samples (learns your voice)
- **Stage 2**: AI critiques the draft, identifies weaknesses, rewrites with improvements
- **Stage 3**: Final polish — grammar, flow, authenticity check
- **Requires uploaded essay documents** before generation (PDF or DOCX)
- Extracts the full readable text server-side, stores the original document metadata, and registers the extracted essay as a writing sample
- Every essay is uniquely personalized — no two users get the same content
- Supports all essay types: Personal Statement, SOP, Motivation Letter, Leadership Essay, Study Plan

### 4. Self-Learning System
- Tracks application outcomes, document gaps, and failure patterns
- Generates personalized recommendations (what to upload, what to fix)
- Shows insights: most common missing documents, frequent blocker fields
- Feeds back into auto-apply and document intelligence to improve over time

### 5. African-Eligible Filtering
- **Default**: shows only African-eligible scholarships
- Country-specific filtering (study destination)
- Degree level, funding type, and field filters

## 🔧 AI Configuration

Copy `.env.example` to `.env` and add your DeepSeek API key:

```env
AI_PROVIDER=deepseek
AI_API_KEY=sk-you...-key
AI_MODEL=deepseek-chat
```

Get your key at https://platform.deepseek.com.

## 📋 What's Included

- Supabase authentication
- 54 African countries supported
- Profile matching with study country, field, degree level filters
- Premium scholarship finder with advanced filters
- Application tracking: Not Started → Saved → Drafting → Ready → Applied → Interview → Awarded
- Document vault with Supabase Storage support
- Browser notifications and PWA support
- Paystack checkout with plan-code support
- CSV export for filtered scholarship views
- JSON-backed persistence in `server/data/zawadi-db.json`

## 🏗️ Architecture

```
server/
├── index.js              # Express API (all routes)
├── modules/
│   ├── ai-client.js           # DeepSeek/OpenAI-compatible client
│   ├── document-intelligence.js  # Document type detection
│   ├── auto-apply-engine.js   # Form filling + draft management
│   ├── essay-generator.js     # 3-stage essay generation
│   └── learning-system.js     # Self-improvement tracking
└── data/
    └── zawadi-db.json         # Persistent storage

client/src/
├── main.jsx               # React SPA (all views)
├── styles.css             # Complete stylesheet
└── components/
    ├── EssayGenerator.jsx      # 3-stage essay UI
    ├── ApplicationCenter.jsx   # Auto-apply dashboard
    └── IntelligencePanel.jsx   # Document analysis UI
```

## 🔑 API Routes

| Route | Description |
|---|---|
| `GET /api/admin/dashboard` | Admin statistics, categories, ingestion status, users, scholarships and audit summary |
| `POST /api/admin/scholarships` | Admin-only scholarship creation |
| `PATCH /api/admin/scholarships/:id` | Admin-only scholarship updates |
| `DELETE /api/admin/scholarships/:id` | Admin-only scholarship deletion |
| `POST /api/scholarships/ingest` | Bot ingestion endpoint protected by `INGEST_API_KEY` |
| `POST /api/documents/analyze` | Analyze a single document |
| `POST /api/documents/analyze-batch` | Batch analyze all user documents |
| `GET /api/documents/gap/:id` | Document gap analysis per scholarship |
| `POST /api/apply/:id` | Auto-apply to a scholarship |
| `POST /api/apply/batch` | Batch auto-apply to multiple |
| `GET /api/alerts` | Get unacknowledged alerts |
| `PATCH /api/alerts/:id/acknowledge` | Dismiss an alert |
| `POST /api/essays/generate` | Generate 3-stage essay |
| `GET /api/essays/types` | Get available essay types |
| `POST /api/essays/samples` | Upload writing sample |
| `GET /api/essays/samples` | Get user's writing samples |
| `GET /api/learning/insights` | Learning insights + recommendations |
| `GET /api/learning/summary` | Quick learning dashboard stats |
| `GET /api/scholarships/filtered` | African-only + country filtered view |

## 🚢 Production

Copy `.env.example` to `.env`, fill in Supabase, Paystack, and DeepSeek credentials.

```bash
npm run build
npm start
```

## ✅ Verification

```bash
npm run build
$env:SMOKE_BASE_URL="http://localhost:5174"; npm run smoke:test
```

The smoke test covers admin login, subscription management, DOCX/PDF essay extraction, essay-document storage, rejection of unsupported text uploads, and rejection of non-essay documents.
