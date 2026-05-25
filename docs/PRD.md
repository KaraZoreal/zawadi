# Techsari Zawadi — Product Requirements Document (PRD)

**Document Version:** 2.0  
**Date:** May 25, 2026  
**Author:** Techsari Product Team  
**Status:** Active  

---

## 1. Product Overview

Zawadi is a web-based SaaS platform that helps African students discover, track, and successfully apply to scholarships worldwide. The platform uses AI for profile-based matching, essay generation, document intelligence, and automated application form filling.

**Target Platform:** Modern web browsers (Chrome, Firefox, Safari, Edge) on desktop and mobile. Progressive Web App (PWA) for offline access and push notifications.

**Tech Stack:** React 19 (Vite), Node.js/Express, Supabase (PostgreSQL + Storage), Paystack (payments), Cloudinary (optional media), custom AI ingestion pipeline (Zawadi Bot on DeepSeek).

---

## 2. User Personas

### Persona 1: Amara — The Determined Undergraduate
- **Age:** 21, Nigeria
- **Goals:** Find fully-funded Master's in Europe
- **Pain Points:** Doesn't know which scholarships accept Nigerians, overwhelmed by 30+ applications, can't write unique essays for each
- **Plan:** Explorer (free) → Scholar Plus once committed

### Persona 2: Kofi — The Working Professional
- **Age:** 28, Ghana
- **Goals:** PhD in the US with full funding
- **Pain Points:** Limited time outside work, needs maximum efficiency, willing to pay for tools that save time
- **Plan:** Application Pro from day one

### Persona 3: Fatima — The First-Generation Student
- **Age:** 19, Kenya
- **Goals:** Undergraduate scholarship abroad
- **Pain Points:** No family experience with applications, doesn't know what documents are needed, intimidated by essays
- **Plan:** Free tier with strong guidance features

### Persona 4: Admin — The Platform Operator
- **Role:** Techsari team member
- **Goals:** Curate scholarship database, manage users, monitor payments, ensure data quality
- **Tools Needed:** Admin panel with CRUD, user management, analytics, and bulk import

---

## 3. Functional Requirements

### 3.1 Landing Page (Public)
| ID | Requirement | Priority | User Story |
|---|---|---|---|
| LP-01 | Hero section with mission statement and value proposition | P0 | As a visitor, I want to understand what Zawadi offers in 10 seconds |
| LP-02 | Feature highlights with icons (discovery, matching, essays, tracking) | P0 | As a visitor, I want to see key features at a glance |
| LP-03 | Pricing comparison table (4 tiers) with monthly/annual toggle | P0 | As a visitor, I want to compare plans before signing up |
| LP-04 | "Get Started" and "Sign In" CTAs prominently placed | P0 | As a visitor, I want clear paths to start or return |
| LP-05 | Competitive comparison matrix | P1 | As a visitor, I want to understand why Zawadi is different |
| LP-06 | Testimonials/social proof section | P2 | As a visitor, I want to see that other students trust Zawadi |
| LP-07 | FAQ section | P2 | As a visitor, I want quick answers to common questions |

### 3.2 Authentication & Onboarding
| ID | Requirement | Priority | User Story |
|---|---|---|---|
| AU-01 | Email + password registration (name, email, country, password ≥8 chars) | P0 | As a new user, I want to create an account in 30 seconds |
| AU-02 | Email + password login with session persistence (30-day httpOnly cookie) | P0 | As a returning user, I want to log in once and stay logged in |
| AU-03 | Supabase Auth as primary, local auth as fallback | P0 | As the platform, I want redundant auth for reliability |
| AU-04 | Password hashing with scrypt + random salt + timing-safe comparison | P0 | As the platform, I want to protect user credentials |
| AU-05 | Forgot password flow (email reset link) | P1 | As a user, I want to recover access if I forget my password |
| AU-06 | Logout clears all sessions | P0 | As a user, I want to securely log out |
| AU-07 | Admin-only login endpoint (separate from user auth) | P0 | As an admin, I want a dedicated secure login |
| AU-08 | Rate limiting on auth endpoints (20 req/min) | P0 | As the platform, I want to prevent brute-force attacks |

### 3.3 Scholarship Database & Discovery
| ID | Requirement | Priority | User Story |
|---|---|---|---|
| SD-01 | View all scholarships in a sortable, filterable table/spreadsheet | P0 | As a user, I want to browse all available scholarships |
| SD-02 | Filter by country, degree level, field, funding type, deadline urgency | P0 | As a user, I want to narrow down to scholarships I'm eligible for |
| SD-03 | Match score (0-100%) displayed for each scholarship based on user profile | P0 | As a user, I want to see which scholarships are most relevant |
| SD-04 | Deadline urgency indicators: 🔴 Within 14 days, 🟡 Within 30 days, 🟢 90+ days, 🔵 Rolling | P0 | As a user, I want to prioritize by deadline |
| SD-05 | Search by keyword (name, provider, field, country) | P1 | As a user, I want to find specific scholarships |
| SD-06 | Each listing shows: name, provider, countries, amount, eligibility, required documents, deadline, direct apply link | P0 | As a user, I want complete information before applying |
| SD-07 | Direct application link opens in new tab — no aggregator redirects | P0 | As a user, I want one-click access to the official application |
| SD-08 | Export filtered scholarships to CSV | P2 | As a power user, I want to analyze offline |

### 3.4 Application Tracking & Management
| ID | Requirement | Priority | User Story |
|---|---|---|---|
| AT-01 | Track each scholarship through statuses: Not Started → Saved → Drafting → Ready → Applied → Interview → Awarded → Rejected → Archived | P0 | As a user, I want to know the status of every application |
| AT-02 | Toggle "Applied" checkbox to mark applications as submitted | P0 | As a user, I want a quick way to mark applications |
| AT-03 | Set priority: High / Normal / Low | P0 | As a user, I want to prioritize my applications |
| AT-04 | Add notes to each application (free text) | P1 | As a user, I want to track next steps or thoughts |
| AT-05 | Document gap analysis: show missing documents for each scholarship | P0 | As a user, I want to know what I still need to prepare |
| AT-06 | Stats dashboard: total, applied, drafting, not applied, urgent, strong matches | P0 | As a user, I want a birds-eye view of my progress |
| AT-07 | Dashboard categories filter (e.g., "AI & Data Science", "Public Health") | P1 | As a user, I want to filter by my interest areas |

### 3.5 Document Vault
| ID | Requirement | Priority | User Story |
|---|---|---|---|
| DV-01 | Upload documents by type (CV, transcript, passport, certificate, etc.) | P0 | As a user, I want to store my documents in one place |
| DV-02 | Document type list: CV, Resume, Transcript, Certificate, Motivation Letter, SOP, References, Passport, Financial Evidence, Admission Letter, Essay, Other | P0 | As a user, I want to categorize my documents |
| DV-03 | Free tier: max 3 documents | P0 | As the platform, I want a clear free tier limitation |
| DV-04 | Paid tiers: unlimited documents | P0 | As a paid user, I want no document limits |
| DV-05 | Delete documents (with confirmation) | P0 | As a user, I want to remove outdated documents |
| DV-06 | Supabase storage with RLS (private by user) | P0 | As the platform, I want secure document storage |
| DV-07 | Show "required documents" gap list from top 6 matched scholarships | P1 | As a user, I want to see what to prepare next |
| DV-08 | Document intelligence: AI analysis of uploaded documents (P1) | P1 | As a paid user, I want AI feedback on my documents |

### 3.6 AI Essay Generator
| ID | Requirement | Priority | User Story |
|---|---|---|---|
| EG-01 | 3-stage pipeline: Draft → Critique & Rewrite → Final Polish | P0 | As a user, I want high-quality, iterative essay generation |
| EG-02 | Essay types: Personal Statement, SOP, Motivation Letter, Leadership Essay, Study Plan | P0 | As a user, I want the right essay type for each application |
| EG-03 | AI learns user's voice from uploaded writing samples | P1 | As a user, I want essays that sound like me |
| EG-04 | Free tier: 3 essays/day (90/month) | P0 | As the platform, I want a generous but bounded free tier |
| EG-05 | Paid tiers: 15-50 essays/day | P0 | As a paid user, I want higher limits |
| EG-06 | Rate-limited API (8 req/min for generation) | P0 | As the platform, I want to prevent abuse |

### 3.7 Auto-Apply Engine
| ID | Requirement | Priority | User Story |
|---|---|---|---|
| AA-01 | Auto-fill scholarship application forms using user profile and documents | P1 | As a user, I want to save time on form filling |
| AA-02 | Batch auto-apply to multiple scholarships at once | P2 | As a power user, I want maximum efficiency |
| AA-03 | Validate required fields — show exactly what's missing before submission | P1 | As a user, I want to know what I still need |
| AA-04 | Save drafts when fields can't be auto-filled | P1 | As a user, I want to pick up where I left off |

### 3.8 Payments & Subscriptions
| ID | Requirement | Priority | User Story |
|---|---|---|---|
| PY-01 | Freemium model: sign up free, upgrade when you hit limits | P0 | As a user, I want to try before I buy |
| PY-02 | Upgrade prompt when free limits are reached | P0 | As the platform, I want timely conversion triggers |
| PY-03 | Paystack subscription plans: monthly and annual for all 3 paid tiers | P0 | As a user, I want recurring billing in my local currency |
| PY-04 | Payments processed in KES via Paystack (prices displayed in USD and local currency) | P0 | As a user, I want to pay in my local currency |
| PY-05 | Plan upgrade/downgrade with proration | P1 | As a user, I want flexibility to change plans |
| PY-06 | Cancel subscription (access remains until period end) | P1 | As a user, I want to cancel without losing immediate access |
| PY-07 | Paystack webhook handling: subscription.create, subscription.not_renew, subscription.disable, charge.success | P0 | As the platform, I want real-time payment sync |
| PY-08 | Webhook signature verification with Paystack secret key | P0 | As the platform, I want to prevent fake payment confirmations |
| PY-09 | Monthly/annual toggle on pricing page with local currency display | P0 | As a user, I want to compare pricing options |
| PY-10 | Payment history and invoice generation | P1 | As a user, I want records of my payments |

### 3.9 Admin Panel
| ID | Requirement | Priority | User Story |
|---|---|---|---|
| AD-01 | Standalone page at `/admin` — completely separate from main app | P0 | As the platform, I want no admin references visible to regular users |
| AD-02 | Admin login with dedicated credentials (not shared with user auth) | P0 | As an admin, I want secure, isolated access |
| AD-03 | Dashboard with metrics: total scholarships, users, active subscriptions | P0 | As an admin, I want a quick overview |
| AD-04 | User management table: name, email, country, plan, payment status, join date | P0 | As an admin, I want to manage user accounts |
| AD-05 | Live plan switching for users via dropdown | P0 | As an admin, I want to manually adjust user plans |
| AD-06 | Scholarships management: add, edit, delete, bulk import | P0 | As an admin, I want full content control |
| AD-07 | Subscriptions tab: view all payment records | P1 | As an admin, I want to reconcile payments |
| AD-08 | Audit log endpoint (monitor and admin routes only) | P1 | As the platform, I want an audit trail |

### 3.10 Zawadi Bot (Automated Ingestion)
| ID | Requirement | Priority | User Story |
|---|---|---|---|
| ZB-01 | Daily scholarship hunt (9 AM EAT) — automated web research | P0 | As the platform, I want fresh scholarships daily |
| ZB-02 | Auto-POST found scholarships to `/api/scholarships/ingest` with INGEST_API_KEY | P0 | As the platform, I want automated ingestion |
| ZB-03 | Deduplication by (name, host) — no duplicate scholarship entries | P0 | As the platform, I want clean data |
| ZB-04 | Link validation — reject aggregator URLs, accept only direct application links | P0 | As the platform, I want to enforce link quality |
| ZB-05 | Urgent deadline alerts (9 AM + 9 PM EAT) for scholarships closing within 7 days | P1 | As a user, I don't want to miss urgent deadlines |
| ZB-06 | Search all scholarships for all Africans, all fields — no restriction to AI/ML | P0 | As the platform, I want comprehensive coverage |

---

## 4. Non-Functional Requirements

### 4.1 Performance
| ID | Requirement | Target |
|---|---|---|
| NF-P01 | Page load time (first contentful paint) | <2s on 3G |
| NF-P02 | API response time (95th percentile) | <500ms |
| NF-P03 | Essay generation time | <30s per stage |
| NF-P04 | Concurrent users supported | 1,000 without degradation |
| NF-P05 | Time-to-interactive on landing page | <3s |

### 4.2 Security
| ID | Requirement | Implementation |
|---|---|---|
| NF-S01 | Password hashing | scrypt + random 16-byte salt + timing-safe comparison |
| NF-S02 | Session management | httpOnly, sameSite=lax, secure cookies, 30-day expiry |
| NF-S03 | API authentication | Bearer token (Supabase JWT) or session cookie |
| NF-S04 | Rate limiting | Auth: 20 req/min, Essay generation: 8 req/min, General: 30 req/min |
| NF-S05 | CORS | Restricted to known origins |
| NF-S06 | Data encryption at rest | Supabase AES-256 (PostgreSQL + Storage) |
| NF-S07 | Data encryption in transit | TLS 1.2+ (HTTPS) |
| NF-S08 | Webhook verification | Paystack HMAC SHA-512 signature check |
| NF-S09 | Input validation | All user inputs sanitized; SQL injection prevented via parameterized queries |
| NF-S10 | Admin isolation | Admin panel served from separate route; zero admin code in client bundle |

### 4.3 Accessibility
| ID | Requirement |
|---|---|
| NF-A01 | WCAG 2.1 AA compliance on all public pages |
| NF-A02 | Keyboard navigation for all interactive elements |
| NF-A03 | Screen reader support with proper ARIA labels |
| NF-A04 | Color contrast ratio ≥ 4.5:1 for text |
| NF-A05 | Responsive design (mobile-first, 320px — 2560px) |

### 4.4 Reliability & Availability
| ID | Requirement | Target |
|---|---|---|
| NF-R01 | Uptime | 99.5% (Vercel SLA) |
| NF-R02 | Data backup | Daily Supabase backups |
| NF-R03 | Graceful degradation | Local auth fallback if Supabase unavailable |
| NF-R04 | Error handling | User-friendly error messages; never expose stack traces |

### 4.5 Data Privacy
| ID | Requirement |
|---|---|
| NF-P01 | Privacy Policy published and accessible from every page |
| NF-P02 | Data retention policy: delete user data within 30 days of account deletion request |
| NF-P03 | Consent: clear opt-in for email notifications and data processing |
| NF-P04 | Right to access: users can request all their stored data |
| NF-P05 | Right to deletion: users can delete their account and all associated data |
| NF-P06 | No third-party data sharing without explicit consent |
| NF-P07 | Cookie consent: only essential cookies (auth session) — no tracking cookies |

---

## 5. Feature Prioritization (MoSCoW)

### Must Have (MVP — May 2026)
- Landing page with mission + pricing
- Email/password auth with password hashing
- Scholarship database with filtering and search
- Match scores and urgency indicators
- Application tracking dashboard
- Document vault (3 docs free)
- AI essay generator (3-stage, 3/day free)
- Freemium payments via Paystack (KES)
- Admin panel (separate, secure)
- Zawadi Bot ingestion pipeline
- Rate limiting on all auth/generation endpoints

### Should Have (Post-MVP — Q3 2026)
- Forgot password flow
- Dashboard category filters
- Document gap analysis from matches
- Payment history and invoices
- Urgent deadline alerts
- User NPS survey
- Privacy Policy page
- Terms of Service page

### Could Have (Q4 2026)
- AI learns user voice from samples
- Batch auto-apply
- Export to CSV
- Testimonials section
- FAQ section
- Mobile PWA push notifications

### Won't Have (Phase 1)
- Native mobile apps
- Mentor network
- University API integrations
- French/Portuguese localization
- White-label solutions

---

## 6. User Flows

### 6.1 New User Onboarding
```
Landing Page → "Get Started" → Registration Form → Auto-login → Dashboard (empty state with guidance)
```

### 6.2 Scholarship Discovery → Application
```
Dashboard → Browse Scholarships → Filter/ Sort → View Details → "Apply Now" (external link) → Track in Dashboard
```

### 6.3 Essay Generation
```
Dashboard → Essay Generator → Select Type → Enter Prompt → Generate Draft → Critique → Polish → Copy/Download
```

### 6.4 Payment Upgrade
```
Free Tier Limit Reached → Upgrade Prompt → Pricing Page → Select Plan → Paystack Checkout → Webhook Confirmation → Plan Activated
```

---

## 7. API Endpoints (Summary)

See `server/index.js` for full implementation. Key endpoint groups:

| Group | Base Path | Auth Required |
|---|---|---|
| Config | `/api/config` | No |
| Auth | `/api/auth/*` | Rate-limited |
| Scholarships | `/api/scholarships*` | Yes (read), Admin (write) |
| Documents | `/api/documents*` | Yes |
| Essays | `/api/essays/*` | Yes, rate-limited |
| Billing | `/api/billing/*` | Yes |
| Payment | `/api/payment/*` | Yes |
| Paystack Webhook | `/api/paystack/webhook` | HMAC signature |
| Admin | `/api/admin/*` | Admin only |
| Ingestion | `/api/scholarships/ingest` | API key |
| Security | `/api/security` | No |
| Health | `/api/health` | No |

---

*PRD reviewed by: _____________________ Date: _____________________*
