# Techsari Zawadi — Business Requirements Document (BRD)

**Document Version:** 2.0  
**Date:** May 25, 2026  
**Author:** Techsari Product Team  
**Status:** Active  
**Classification:** Internal — Confidential  

---

## 1. Executive Summary

Techsari Zawadi is an AI-powered scholarship discovery and application management platform purpose-built for African students. It addresses the acute market failure where talented African students miss life-changing educational opportunities due to fragmented information, eligibility blindness, deadline chaos, and lack of application support tools.

The platform combines a verified scholarship database, AI-driven matching, application tracking, AI essay generation, document intelligence, and an auto-apply engine — all accessible via a freemium model starting at $5/month via Paystack (payable in local currency).

This BRD defines the business case, market opportunity, stakeholder requirements, success metrics, and implementation scope for stakeholders, investors, and the development team.

---

## 2. Business Case

### 2.1 Market Opportunity

| Metric | Value | Source |
|---|---|---|
| Sub-Saharan African students abroad (2023-24) | 56,780 (US alone), ~400,000+ globally | IIE Open Doors, UNESCO |
| Nigerian students abroad | ~85,000 (30% of African total) | WENR 2024 |
| Annual growth rate of African student mobility | 8-12% YoY | ICEF Monitor |
| Scholarships available annually for Africans | Estimated 5,000-8,000 distinct programs | Cross-referenced aggregator analysis |
| Average applications per serious African student | 15-30 in a year | Techsari user research |
| Africa EdTech market size (2024) | $3.2B, growing at 15% CAGR | HolonIQ |
| African students who miss deadlines due to poor tracking | ~40% (self-reported) | Techsari survey (n=200) |

### 2.2 Problem Quantification

The **true cost** of the status quo:
1. **Information fragmentation**: Scholarships scattered across 500+ websites, portals, and aggregators with no Africa-first filter
2. **Eligibility blindness**: 70% of scholarship search results shown to African students are for non-eligible nationalities (Zawadi internal research)
3. **Application overwhelm**: Students apply to 15-30 scholarships with zero tooling — tracking in spreadsheets or phone notes
4. **Essay burden**: Each application demands unique essays (SOP, motivation letter, personal statement) — most students submit generic copy-paste
5. **Trust crisis**: 35% of scholarship listings found online are expired, inaccurate, or misleading

### 2.3 Revenue Model

| Tier | Price (Monthly) | Price (Annual) | Target Segment |
|---|---|---|---|
| Explorer (Free) | $0 | $0 | Discovery-only users, students testing the platform |
| Scholar Plus | $5/mo | $50/yr | Active applicants needing premium matching and documents |
| Application Pro | $12/mo | $120/yr | Power users managing 15+ applications simultaneously |
| Mentor Review | $29/mo | $290/yr | Students needing expert essay review and application strategy |

**Revenue projections (Year 1):**
- Target: 1,000 users → 5% conversion → 50 paid users
- ARPU: ~$8/month (blended)
- Year 1 ARR: ~$4,800
- Year 2 ARR (10,000 users, 8% conversion): ~$76,800

---

## 3. Stakeholders

### 3.1 Primary Stakeholders

| Stakeholder | Role | Key Concerns |
|---|---|---|
| African Students (18-35) | End users | Discovery, matching accuracy, application success |
| Techsari (Company) | Product owner | Revenue, user growth, market share |
| Scholarship Providers | Content partners | Reach qualified African applicants |
| Universities | Ecosystem partners | Pre-qualified applicant pipeline |

### 3.2 Secondary Stakeholders

| Stakeholder | Role | Key Concerns |
|---|---|---|
| Parents/Guardians | Financial backers | ROI on scholarship applications |
| NGOs & Youth Organizations | Distribution partners | Tools for their beneficiaries |
| African Governments | Policy stakeholders | Data on student mobility |

---

## 4. Scope

### 4.1 In Scope (Phase 1 — MVP)

- Scholarship database with 500+ verified listings for African students
- AI-powered profile matching with match scores
- Application tracking dashboard (status, priority, notes)
- AI essay generator (3-stage pipeline: draft → critique → polish)
- Document vault with upload and gap analysis
- Auto-apply engine (form auto-fill)
- Freemium payments via Paystack (KES, NGN, USD)
- Zawadi Bot — automated scholarship ingestion
- Admin panel for content management
- Landing page with mission and value proposition

### 4.2 Out of Scope (Phase 1)

- Native mobile apps (iOS/Android) — Phase 2
- Mentor matching network — Phase 3
- University API integrations — Phase 2
- French/Portuguese localization — Phase 3
- Affiliate/referral program — Phase 2
- White-label for universities — Phase 3

---

## 5. Success Metrics (KPIs)

| Metric | 6-Month Target | 12-Month Target | Measurement |
|---|---|---|---|
| Active Users | 1,000 | 10,000 | Weekly active user count |
| Scholarships in Database | 500 | 1,500 | Verified, active listings |
| Applications Tracked | 5,000 | 75,000 | Application status changes |
| AI Essays Generated | 10,000 | 200,000 | Essay generation API calls |
| Match Accuracy | >85% | >90% | User feedback survey |
| Free-to-Paid Conversion | 5% | 8% | Payment webhooks |
| User NPS | >50 | >60 | Quarterly NPS survey |
| Countries Represented | 15 | 35 | User registration data |
| Scholarship Win Rate | Data collection | >15% | User-reported outcomes |
| Bot Ingestion Speed | <24hrs | <6hrs | Time from discovery to live |
| Dead Link Rate | <2% | <1% | Automated link checker |

---

## 6. Constraints & Assumptions

### 6.1 Constraints
- Must process payments in KES/NGN via Paystack
- Must support all 54 African countries at launch
- Free tier must be genuinely useful (not a crippled teaser)
- All scholarship listings must have verified direct application links
- Must work on low-bandwidth connections common in Africa

### 6.2 Assumptions
- Paystack can process recurring subscriptions in KES
- Supabase free tier is sufficient for MVP scale
- AI model costs (essay generation) are manageable at projected volumes
- Users have access to smartphones or computers with internet
- Scholarship providers will not block automated ingestion

---

## 7. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Scholarship data becomes stale | High | High | Zawadi Bot daily hunts; automated link checker |
| Paystack subscription failures | Medium | High | Webhook monitoring; fallback one-time payments |
| AI essay quality complaints | Medium | Medium | 3-stage pipeline; human-in-loop review option |
| Competitor launches similar product | Medium | High | Build moat: AI essay + auto-apply + Africa-first |
| Supabase rate limits at scale | Low | High | Dual-write to local JSON; migrate to dedicated DB |
| User data privacy breach | Low | Critical | AES-256 encryption; RLS; audit logging; SOC 2 roadmap |
| Regulatory changes (data laws) | Medium | Medium | Privacy-by-design; regular legal review |

---

## 8. Timeline & Milestones

| Milestone | Target Date | Deliverables |
|---|---|---|
| MVP Launch | May 2026 | Core platform: database, matching, tracking, essay gen, payments |
| Bot Integration | May 2026 | Automated ingestion pipeline with deduplication |
| Payment Go-Live | May 2026 | Paystack subscriptions with webhook lifecycle |
| 100 Verified Scholarships | June 2026 | Quality over quantity; every listing vetted |
| 500 Active Users | August 2026 | Marketing push across African university networks |
| Mobile App Beta | Q1 2027 | Native iOS/Android |
| 10,000 Users | Q2 2027 | Scale infrastructure; mentor network |

---

*BRD approved by: _____________________ Date: _____________________*
