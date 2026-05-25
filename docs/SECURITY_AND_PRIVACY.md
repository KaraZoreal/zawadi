# Techsari Zawadi — Security Rules & Privacy Policy

**Document Version:** 1.0  
**Date:** May 25, 2026  
**Author:** Techsari Product Team  
**Classification:** Public (Privacy Policy) + Internal (Security Rules)  
**Last Reviewed:** May 25, 2026  

---

## PART A: Security Architecture & Rules

### 1. Authentication & Authorization

#### 1.1 Password Policy
- **Minimum length:** 8 characters
- **Hashing algorithm:** `crypto.scryptSync` (Node.js built-in) with:
  - Random 16-byte salt per password
  - 64-byte key length
  - Timing-safe comparison (`crypto.timingSafeEqual`)
- **Storage:** Salt and hash stored as `salt:hash` string
- **No plaintext passwords anywhere** — not in logs, not in database exports, not in memory beyond initial hashing

#### 1.2 Session Management
- **Cookie name:** `zawadi_session`
- **Cookie flags:**
  - `httpOnly: true` — inaccessible to JavaScript (XSS protection)
  - `sameSite: "lax"` — CSRF protection
  - `secure: true` (in production/Vercel) — HTTPS only
  - `path: "/"` — available to all routes
- **Session duration:** 30 days (2,592,000,000 ms)
- **Session token:** Random UUID v4 (`crypto.randomUUID()`)
- **Session storage:** In `zawadi-db.json` / Supabase; linked to user ID

#### 1.3 API Authentication
- **Bearer tokens:** Supabase JWT passed in `Authorization: Bearer <token>` header
- **Fallback auth:** Session cookie-based authentication
- **Admin routes:** Require admin role (`requireAdmin` middleware) checked against `user.role === "admin"`

#### 1.4 Rate Limiting
| Endpoint Group | Window | Limit | Rationale |
|---|---|---|---|
| `/api/auth/*` | 60 seconds | 20 requests | Brute-force prevention |
| `/api/essays/generate` | 60 seconds | 8 requests | Prevent AI abuse |
| General API | 60 seconds | 30 requests | Fair usage |

---

### 2. Data Protection

#### 2.1 Data Classification

| Data Category | Examples | Protection Level |
|---|---|---|
| **Public** | Scholarship listings, pricing plans | None needed |
| **Internal** | User counts, match scores | Access-controlled |
| **Confidential** | Email addresses, names, countries, application statuses | Encrypted at rest + access-controlled |
| **Restricted** | Password hashes, payment records, uploaded documents | Maximum protection: scrypt + AES-256 + RLS |

#### 2.2 Data at Rest
- **Supabase PostgreSQL:** AES-256 encryption at rest (provider-managed)
- **Supabase Storage (documents):** Server-side AES-256 encryption; private buckets with RLS
- **Local development:** JSON file storage; NOT encrypted at rest (development only)
- **No sensitive data in client-side localStorage** (except non-sensitive preference flags)

#### 2.3 Data in Transit
- **Production (Vercel):** HTTPS/TLS 1.2+ enforced
- **Paystack API calls:** HTTPS with secret key in `Authorization: Bearer` header
- **Supabase API calls:** HTTPS with anon/service role keys
- **Local development:** HTTP (unencrypted) — development only

#### 2.4 Data Minimization
Zawadi collects only the minimum data required:
- **Required at registration:** Name, email, password (hashed), country
- **Optional:** Uploaded documents, application notes, essay prompts
- **NOT collected:** Date of birth, physical address, phone number, government ID numbers, financial details (handled by Paystack)

#### 2.5 Data Retention
| Data Type | Retention Period | Deletion Policy |
|---|---|---|
| User account (active) | Until account deletion | Full purge within 30 days of request |
| User account (inactive, 12+ months) | 12 months after last login | Anonymized or deleted |
| Payment records | 7 years (tax compliance) | Retained even after account deletion |
| Application history | Until account deletion | User-requested deletion |
| Audit logs | 12 months | Rotated monthly |

---

### 3. Payment Security

#### 3.1 Paystack Integration
- **PCI-DSS compliance:** Handled entirely by Paystack — Zawadi NEVER sees, stores, or transmits raw card numbers
- **API authentication:** `Authorization: Bearer sk_...` (secret key, server-side only)
- **Webhook verification:** Every webhook payload verified using `crypto.createHmac("sha512", PAYSTACK_SECRET_KEY)` — signature must match `x-paystack-signature` header
- **Idempotency:** Webhook handlers check for duplicate events by reference ID
- **Subscription lifecycle:** Managed via Paystack webhooks (`subscription.create`, `subscription.not_renew`, `subscription.disable`)

#### 3.2 Payment Data Storage
- **Stored:** Payment reference, amount, currency, plan, status, timestamp
- **NOT stored:** Card numbers, CVV, bank details, PINs
- **Paystack reference:** Linked to user account for support/reconciliation

---

### 4. Infrastructure Security

#### 4.1 Hosting
- **Frontend + API:** Vercel (SOC 2 Type II, ISO 27001)
- **Database + Storage:** Supabase (SOC 2, GDPR compliant)
- **Payments:** Paystack (PCI-DSS Level 1)

#### 4.2 Environment Variables
All secrets stored in environment variables (`.env` in development, Vercel Environment Variables in production):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — client-safe (exposed to frontend via `/api/config`)
- `SUPABASE_SERVICE_ROLE_KEY` — server-only (NEVER exposed to client)
- `PAYSTACK_SECRET_KEY` — server-only
- `INGEST_API_KEY` — server-only (Zawadi Bot authentication)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` — server-only
- `DEEPSEEK_API_KEY` — server-only

#### 4.3 CORS Policy
- Production: Restricted to known origins (`https://www.techsari.online`)
- Development: `http://localhost:5173`
- API endpoints: Access-Control-Allow-Origin set explicitly

#### 4.4 Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
```

---

### 5. Incident Response

#### 5.1 Breach Detection
- Monitor for unusual patterns: failed login spikes, unexpected plan changes, bulk data exports
- Supabase audit logs (when enabled) for database access patterns
- Paystack webhook monitoring for payment anomalies

#### 5.2 Breach Response (within 72 hours)
1. **Contain:** Revoke compromised keys, invalidate affected sessions
2. **Assess:** Determine scope — what data was accessed, how, when
3. **Notify:** Email affected users within 72 hours of confirmed breach
4. **Fix:** Patch vulnerability, rotate all secrets
5. **Document:** Post-mortem with timeline and preventive measures
6. **Report:** Notify relevant authorities if required by law

#### 5.3 Responsible Disclosure
- Security vulnerabilities can be reported to: `security@techsari.online`
- Acknowledgment within 48 hours
- Resolution target: Critical (24h), High (72h), Medium (7 days), Low (next release)

---

## PART B: Privacy Policy (Public-Facing)

*This Privacy Policy is published at `https://www.techsari.online/privacy` and linked from every page.*

---

### 1. Who We Are

**Techsari Zawadi** ("we," "our," "us") is a scholarship discovery and application management platform operated by Techsari, serving African students worldwide.

**Contact:**  
Email: privacy@techsari.online  
Website: https://www.techsari.online

---

### 2. What Data We Collect

| Data | When Collected | Purpose |
|---|---|---|
| Full name | Registration | Account identification; essay personalization |
| Email address | Registration | Account login; password reset; service notifications |
| Password (hashed) | Registration | Account authentication |
| Country | Registration | Scholarship eligibility filtering; localized pricing |
| Application tracking data | Platform usage | Scholarship management; match score improvement |
| Uploaded documents | User upload | Document vault for application support |
| Essay prompts/content | Essay generator usage | AI essay generation |
| Payment transaction references | Payment checkout | Subscription management; receipts |
| Usage analytics | Platform interaction | Product improvement (aggregated, anonymized) |

**We do NOT collect:** Date of birth, physical address, phone number, government ID numbers, credit card numbers, bank account details, or biometric data.

---

### 3. How We Use Your Data

- **To provide the service:** Match you with scholarships, generate essays, track applications
- **To improve the product:** Analyze usage patterns (aggregated and anonymized) to improve features
- **To communicate:** Send service updates, deadline alerts, and (with consent) product newsletters
- **To process payments:** Facilitate Paystack subscription payments (we never see your card details)
- **To comply with legal obligations:** Tax records, regulatory requirements

**We do NOT sell, rent, or share your personal data with third parties for their marketing purposes.**

---

### 4. Legal Basis for Processing

Under applicable data protection laws (including Kenya's Data Protection Act 2019, Nigeria's NDPR, and the GDPR for EU residents), we process your data on the following legal bases:

- **Contractual necessity:** To provide the Zawadi service you signed up for
- **Legitimate interest:** To improve and secure our platform
- **Consent:** For optional communications (newsletters, product updates)
- **Legal obligation:** Tax records and regulatory compliance

---

### 5. Data Storage & Security

- **Where:** Data is stored on Supabase servers (EU and US regions) and Vercel edge network
- **Encryption:** All data encrypted at rest (AES-256) and in transit (TLS 1.2+)
- **Passwords:** Hashed using scrypt with unique salt — we cannot recover your password
- **Access control:** Your data is accessible only to you (via authentication) and to authorized Techsari administrators for support purposes

---

### 6. Data Retention

| Data | How Long We Keep It |
|---|---|
| Active account data | Until you delete your account |
| Inactive account (12+ months no login) | 12 months, then anonymized or deleted |
| Payment records | 7 years (tax compliance) |
| Deleted account data | Purged within 30 days of deletion request |

---

### 7. Your Rights

You have the right to:
- **Access:** Request a copy of all data we hold about you
- **Correct:** Update inaccurate or incomplete data
- **Delete:** Request deletion of your account and all associated data
- **Export:** Receive your data in a portable format (JSON)
- **Withdraw consent:** Opt out of non-essential communications
- **Complain:** Lodge a complaint with your local data protection authority

To exercise any of these rights, email **privacy@techsari.online**. We will respond within 30 days.

---

### 8. Cookies

Zawadi uses only **essential cookies** required for the platform to function:

| Cookie | Purpose | Duration | Type |
|---|---|---|---|
| `zawadi_session` | Authentication session | 30 days | Essential |

We do NOT use tracking cookies, advertising cookies, or third-party analytics cookies. No cookie consent banner is required because we only use essential cookies.

---

### 9. Third-Party Services

We use the following third-party services that may process your data:

| Service | Purpose | Data Shared | Privacy Policy |
|---|---|---|---|
| Supabase | Database & file storage | All platform data | [Supabase Privacy](https://supabase.com/privacy) |
| Paystack | Payment processing | Payment references, amounts | [Paystack Privacy](https://paystack.com/privacy) |
| Vercel | Hosting | All platform data | [Vercel Privacy](https://vercel.com/legal/privacy-policy) |
| DeepSeek (via OpenRouter) | AI essay generation | Essay prompts (transient) | [OpenRouter Privacy](https://openrouter.ai/privacy) |

---

### 10. Children's Privacy

Zawadi is intended for users aged 16 and above. We do not knowingly collect data from children under 16. If you believe a child under 16 has provided us with personal data, please contact us immediately.

---

### 11. International Data Transfers

Your data may be transferred to and processed in countries outside your country of residence (including the United States and European Union). We ensure appropriate safeguards are in place (standard contractual clauses, provider SOC 2 compliance) for any such transfers.

---

### 12. Changes to This Policy

We will notify you of material changes to this Privacy Policy via email and/or a prominent notice on our platform. Continued use after changes constitute acceptance.

**Last updated:** May 25, 2026  
**Effective date:** May 25, 2026

---

## PART C: Compliance Checklist

### C.1 Kenya Data Protection Act (DPA) 2019

| Requirement | Status | Notes |
|---|---|---|
| Data controller registration | ⚠️ Pending | Techsari must register with ODPC |
| Lawful basis for processing | ✅ | Consent + contractual necessity |
| Data subject rights (access, correct, delete) | ✅ | Implemented via `/api/me` and support |
| Data breach notification (72 hours) | ⚠️ Policy defined | Implementation pending |
| Data Protection Officer | ⚠️ Pending | Designate DPO |
| Cross-border data transfer safeguards | ✅ | SOC 2 providers; SCCs |

### C.2 GDPR (EU Residents)

| Requirement | Status | Notes |
|---|---|---|
| Lawful basis for processing | ✅ | Consent + legitimate interest |
| Right to erasure | ✅ | Account deletion endpoint |
| Data portability | ✅ | JSON export via support |
| Cookie consent | ✅ | Essential cookies only; no banner needed |
| Data Processing Agreement (DPA) | ⚠️ Pending | Needed with Supabase, Vercel |
| Privacy by design | ✅ | Data minimization; encryption; access control |

### C.3 PCI-DSS (Payment Card Industry)

| Requirement | Status | Notes |
|---|---|---|
| Card data handling | ✅ | Fully outsourced to Paystack |
| PCI compliance | ✅ | Inherited from Paystack (Level 1) |
| No raw card data storage | ✅ | Verified — Zawadi stores only references |

---

*Security document reviewed by: _____________________ Date: _____________________*
