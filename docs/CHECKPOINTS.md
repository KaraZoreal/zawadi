# Techsari Zawadi — Checkpoints & Acceptance Criteria

**Document Version:** 1.0  
**Date:** May 25, 2026  
**Author:** Techsari Product Team  

---

## 1. Implementation Checkpoints

### Checkpoint 1: Foundation (✅ COMPLETED)

| Gate | Criteria | Status |
|---|---|---|
| CP1.1 | Landing page with mission, features, pricing | ✅ Passed |
| CP1.2 | Email/password registration with scrypt hashing | ✅ Passed |
| CP1.3 | Login/logout with httpOnly session cookies | ✅ Passed |
| CP1.4 | Supabase integration (auth + storage fallback) | ✅ Passed |
| CP1.5 | Admin panel at `/admin` (isolated from main app) | ✅ Passed |
| CP1.6 | Express server with proper middleware chain | ✅ Passed |
| CP1.7 | Security headers (X-Content-Type-Options, X-Frame-Options, etc.) | ✅ Passed |
| CP1.8 | Rate limiting on auth and generation endpoints | ✅ Passed |

### Checkpoint 2: Scholarship Database (✅ COMPLETED)

| Gate | Criteria | Status |
|---|---|---|
| CP2.1 | Scholarship CRUD (create, read, update, delete) | ✅ Passed |
| CP2.2 | Filtering by country, degree, field, funding, deadline | ✅ Passed |
| CP2.3 | Match scoring based on user profile | ✅ Passed |
| CP2.4 | Deadline urgency visualization (🔴🟡🟢🔵) | ✅ Passed |
| CP2.5 | Direct application links — no aggregator redirects | ✅ Passed |
| CP2.6 | Link validation in ingestion API | ✅ Passed |
| CP2.7 | Deduplication by (name, host) | ✅ Passed |
| CP2.8 | 32+ verified scholarships with direct links | ✅ Passed (32 live) |

### Checkpoint 3: Application Tracking (✅ COMPLETED)

| Gate | Criteria | Status |
|---|---|---|
| CP3.1 | Status tracking through 8 stages | ✅ Passed |
| CP3.2 | Priority setting (High/Normal/Low) | ✅ Passed |
| CP3.3 | Notes field per application | ✅ Passed |
| CP3.4 | Applied toggle checkbox | ✅ Passed |
| CP3.5 | Stats dashboard (total, applied, drafting, urgent, strong matches) | ✅ Passed |
| CP3.6 | Document gap analysis showing missing docs | ✅ Passed |

### Checkpoint 4: Document Vault (✅ COMPLETED)

| Gate | Criteria | Status |
|---|---|---|
| CP4.1 | Upload documents by type | ✅ Passed |
| CP4.2 | Free tier: max 3 documents | ✅ Passed |
| CP4.3 | Delete documents | ✅ Passed |
| CP4.4 | Supabase Storage with RLS | ✅ Passed |
| CP4.5 | Required documents gap list | ✅ Passed |

### Checkpoint 5: AI Essay Generator (✅ COMPLETED)

| Gate | Criteria | Status |
|---|---|---|
| CP5.1 | 3-stage pipeline (Draft → Critique → Polish) | ✅ Passed |
| CP5.2 | 5 essay types supported | ✅ Passed |
| CP5.3 | Free tier: 3 essays/day limit | ✅ Passed |
| CP5.4 | Rate limiting (8 req/min) | ✅ Passed |

### Checkpoint 6: Payments & Subscriptions (✅ COMPLETED)

| Gate | Criteria | Status |
|---|---|---|
| CP6.1 | 4-tier pricing plans (Free, Plus, Pro, Mentor) | ✅ Passed |
| CP6.2 | Monthly/annual toggle with local currency display (KES) | ✅ Passed |
| CP6.3 | Paystack subscription integration (6 plan codes) | ✅ Passed |
| CP6.4 | Webhook handling for subscription lifecycle | ✅ Passed |
| CP6.5 | Webhook signature verification (HMAC SHA-512) | ✅ Passed |
| CP6.6 | Free tier limits enforcement | ✅ Passed |
| CP6.7 | Upgrade prompt when limits reached | ✅ Passed |

### Checkpoint 7: Zawadi Bot (✅ COMPLETED)

| Gate | Criteria | Status |
|---|---|---|
| CP7.1 | Daily scholarship hunt (9 AM EAT) | ✅ Passed |
| CP7.2 | Auto-POST to ingestion API with INGEST_API_KEY | ✅ Passed |
| CP7.3 | Deduplication logic | ✅ Passed |
| CP7.4 | Link validation | ✅ Passed |
| CP7.5 | Urgent deadline alerts | ✅ Passed |

### Checkpoint 8: Security (⚠️ PARTIALLY COMPLETE)

| Gate | Criteria | Status |
|---|---|---|
| CP8.1 | Password hashing with scrypt + salt | ✅ Passed |
| CP8.2 | httpOnly cookies for sessions | ✅ Passed |
| CP8.3 | Rate limiting on auth endpoints | ✅ Passed |
| CP8.4 | Admin route isolation | ✅ Passed |
| CP8.5 | Webhook signature verification | ✅ Passed |
| CP8.6 | Input validation on all endpoints | ✅ Passed |
| CP8.7 | Privacy Policy page published | ❌ Missing |
| CP8.8 | Terms of Service page | ❌ Missing |
| CP8.9 | Email verification on registration | ❌ Missing |
| CP8.10 | CSRF tokens for state-changing requests | ❌ Missing |
| CP8.11 | Account deletion endpoint (user-requested) | ❌ Missing |
| CP8.12 | Data export endpoint (user-requested) | ❌ Missing |
| CP8.13 | CORS restrictions (currently open in dev) | ⚠️ Needs production config |
| CP8.14 | Audit logging for sensitive operations | ⚠️ Extend beyond admin routes |
| CP8.15 | Session invalidation on password change | ❌ Missing |

### Checkpoint 9: Data Privacy (⚠️ PARTIALLY COMPLETE)

| Gate | Criteria | Status |
|---|---|---|
| CP9.1 | Privacy Policy linked from all pages | ❌ Missing |
| CP9.2 | Cookie consent (only essential cookies used) | ⚠️ Policy exists; no UI banner |
| CP9.3 | Right to access data | ❌ No endpoint |
| CP9.4 | Right to deletion | ❌ No endpoint |
| CP9.5 | Data retention policy implemented | ❌ Policy defined; not implemented |
| CP9.6 | No unnecessary PII collected | ✅ Passed |
| CP9.7 | No card data stored | ✅ Passed |

### Checkpoint 10: Accessibility & UX (⚠️ NEEDS IMPROVEMENT)

| Gate | Criteria | Status |
|---|---|---|
| CP10.1 | Responsive design (mobile/tablet/desktop) | ⚠️ Partial |
| CP10.2 | Keyboard navigation | ⚠️ Not tested |
| CP10.3 | Screen reader ARIA labels | ❌ Missing on many elements |
| CP10.4 | Color contrast (4.5:1 minimum) | ⚠️ Not audited |
| CP10.5 | Loading states for all async operations | ✅ Passed |
| CP10.6 | Error states for all failure modes | ✅ Passed |
| CP10.7 | Empty states for all views | ✅ Passed |
| CP10.8 | Landing page mobile-optimized | ⚠️ Needs testing |

### Checkpoint 11: Deployment (⚠️ IN PROGRESS)

| Gate | Criteria | Status |
|---|---|---|
| CP11.1 | Vercel production deployment | ✅ Live |
| CP11.2 | Custom domain (www.techsari.online) | ✅ Configured |
| CP11.3 | API serverless functions working on Vercel | ❌ 404 — needs fix |
| CP11.4 | HTTPS enforced | ✅ Vercel default |
| CP11.5 | Environment variables configured | ✅ |
| CP11.6 | Build pipeline (git push → auto-deploy) | ✅ |

---

## 2. Acceptance Test Scenarios

### 2.1 Authentication Flow

| Test ID | Scenario | Expected Result | Status |
|---|---|---|---|
| AUTH-01 | Register with valid name/email/password (≥8 chars) | Account created, auto-logged in, redirected to dashboard | ✅ |
| AUTH-02 | Register with password <8 chars | Error: "8+ character password required" | ✅ |
| AUTH-03 | Register with existing email | Error: "An account with that email already exists" | ✅ |
| AUTH-04 | Login with correct credentials | Logged in, dashboard loads | ✅ |
| AUTH-05 | Login with wrong password | Error: "Invalid email or password" | ✅ |
| AUTH-06 | Login with non-existent email | Error: "Invalid email or password" (no user enumeration) | ⚠️ Verify no timing difference |
| AUTH-07 | Access protected route without login | Redirected/error: "Authentication required" | ✅ |
| AUTH-08 | Logout | Session destroyed, redirected to login | ✅ |
| AUTH-09 | Session persists for 30 days | Cookie expires after 30 days | ⚠️ Not tested |
| AUTH-10 | Brute-force: 20+ login attempts in 60s | Rate limited (429) | ✅ |

### 2.2 Payment Flow

| Test ID | Scenario | Expected Result | Status |
|---|---|---|---|
| PAY-01 | Free user hits document limit (3 docs) | Shows upgrade prompt | ✅ |
| PAY-02 | Free user hits essay limit (3/day) | Shows upgrade prompt | ✅ |
| PAY-03 | User selects "Scholar Plus Monthly" → Paystack checkout | Redirected to Paystack payment page | ⚠️ Needs live test |
| PAY-04 | Successful payment → webhook received | User plan upgraded; Verifies with signature | ⚠️ Needs live test |
| PAY-05 | Failed payment → webhook received | User stays on current plan | ⚠️ Needs live test |
| PAY-06 | Subscription not_renew → webhook | User downgraded to free | ⚠️ Needs live test |
| PAY-07 | Fake webhook (wrong signature) | Rejected (401) | ⚠️ Needs test |
| PAY-08 | Local currency display | Shows KES equivalent alongside USD | ✅ |

### 2.3 Scholarship Management

| Test ID | Scenario | Expected Result | Status |
|---|---|---|---|
| SCH-01 | Browse all scholarships | Table with all 32+ scholarships | ✅ |
| SCH-02 | Filter by country "Kenya" | Only Kenya-eligible scholarships | ✅ |
| SCH-03 | Filter by degree "Masters" | Only Master's level | ✅ |
| SCH-04 | Click apply link | Opens official URL in new tab | ✅ |
| SCH-05 | Toggle applied checkbox | Status updates; reflected in stats | ✅ |
| SCH-06 | Change application status | Status persists across page reloads | ✅ |
| SCH-07 | Import scholarship with duplicate (name, host) | Returns "skipped" — no duplicate | ✅ |

---

## 3. Go/No-Go Criteria for Production Launch

### Must Pass (Go)

- [x] All auth flows work end-to-end
- [x] No plaintext passwords anywhere
- [x] Scholarship database loads correctly
- [x] Essay generation completes within 30s
- [x] Admin panel isolated from main app
- [ ] **API endpoints work on Vercel production (currently 404)**
- [ ] **Privacy Policy page published and accessible**
- [ ] **Paystack live test (one successful subscription)**

### Should Pass (Conditional Go)

- [ ] Terms of Service page
- [ ] Mobile-responsive layout verified
- [ ] WCAG 2.1 AA color contrast
- [ ] Email verification on registration

---

## 4. Post-Launch Monitoring Checklist

- [ ] Uptime monitoring (Vercel dashboard)
- [ ] Error rate tracking (server logs)
- [ ] Payment webhook health (Paystack dashboard)
- [ ] Daily scholarship count (Zawadi Bot output)
- [ ] User registration rate
- [ ] Essay generation success rate
- [ ] Weekly security scan (dependency audit)

---

*Checkpoints reviewed by: _____________________ Date: _____________________*
