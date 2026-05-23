# Zawadi Production Audit And Implementation Plan

Date: 2026-05-23

## Executive Summary

Zawadi is much closer to a production-grade scholarship workspace after this pass, but it should not be treated as fully production-ready until the remaining backend persistence, payment, observability, and performance items below are completed. The strongest current pieces are the scholarship workspace, admin scholarship publishing flow, document vault metadata, essay sample extraction, and smoke-tested admin subscription management.

## What Was Audited

- Public landing page CTAs, pricing cards, sign-in and get-started paths.
- Authenticated workspace navigation: Overview, Scholarships, Apply, Essays, Doc Intel, Documents, Pricing.
- Admin console: scholarships, users, subscriptions, ingestion, statistics, audit.
- Scholarship ingestion architecture for bot-injected listings.
- Document storage and refresh behavior.
- Essay generation sample upload and 3-stage generation flow.
- Subscription gating, payment initiation, and plan mismatch risks.
- Responsive CSS and build performance.
- Security posture for sessions, file storage, admin actions, and payment webhooks.

## Changes Completed In This Pass

- Public CTAs now have clearer intent: Get Started opens account creation, Sign in opens the sign-in form.
- Pricing is USD-first in the user-visible paid plans, with KES equivalents shown for Kenya users.
- Paid users cannot accidentally pay for a lower tier that is already included in their current plan.
- Free plan messaging now supports unlimited application tracking and 3 AI essays per day.
- Profile saves refresh scholarship matches so recommendations respond to country, field, degree, and study-country changes.
- Document vault persistence is wired through server-side records and secure local storage fallback when Supabase Storage is unavailable.
- Essay sample upload accepts PDF/DOCX, extracts text, rejects non-essay files, and stores usable writing samples.
- Admin subscription payloads include `userId`, which fixes subscription edit/cancel targeting.
- Admin Ingestion and Audit sections are now reachable from the sidebar.
- Admin design was tightened with a darker sidebar, clearer metrics, and category/source overview panels.
- Security headers, rate limiting, secure production cookies, payment webhook verification, and private storage cues are in place.

## Production Blockers Still Remaining

- Replace local JSON persistence with Supabase tables for users, scholarships, applications, documents, usage tracking, essay samples, learning logs, payments, and admin audit events.
- Store uploaded files only in private object storage in production; local storage fallback is useful for development but not enough for multi-instance hosting.
- Add verified recurring subscription handling for renewals, cancellations, failed payments, grace periods, invoices, and webhook idempotency.
- Add server-side authorization checks for all admin scholarship mutation routes; regular user-facing scholarship mutation routes should be admin-only or removed from the normal user app.
- Add a full audit log for admin actions: who changed scholarship/user/subscription data, before/after values, and timestamp.
- Add encryption-at-rest guarantees through the production database/storage provider and document them in the privacy/security page.
- Add monitoring: API latency, error rate, payment webhook failures, upload extraction failures, generation failures, and unusual admin activity.
- Code-split the frontend bundle. Current production build warns because the main JS chunk is about 509 kB minified.

## Functional Flow Plan

1. Landing and auth
   - Keep Get Started mapped to account creation and Sign in mapped to login.
   - Add password reset UI for the existing reset endpoints.
   - Add post-checkout return handling so a user sees payment success/failure inside Zawadi, not only at Paystack.

2. Scholarship data architecture
   - Use one canonical scholarship schema shared by admin, bot ingestion, and the live website.
   - Bot-injected scholarships should default to unpublished until an admin verifies source URL, deadline, eligibility, and required documents.
   - Admin edits should update the live scholarship list immediately after publish/unpublish.

3. Recommendations
   - Keep sorting by match score first, then urgency, document readiness, and deadline.
   - Expand matching signals: country eligibility, degree level, field fit, destination preference, funding need, accessibility tags, and document readiness.
   - Track user interactions so recommendations learn from saved, drafted, applied, rejected, and awarded applications.

4. Applications
   - All users should manage unlimited applications.
   - Free users get limited assisted automation, not limited tracking.
   - Application records should include status history, next action, deadline reminders, document gaps, and generated essay links.

5. Essay generation
   - Keep the three-stage pipeline: draft, red-flag critique/rewrite, reviewer simulation/final polish.
   - Require at least one stored writing sample; recommend three for best voice quality.
   - Save final essays as application documents when the user chooses to use them.
   - Add daily/monthly limits enforced by the server for every plan.

6. Payments and subscriptions
   - USD is the base price; local currency display is approximate unless a live FX provider is integrated.
   - The cheapest paid tier must remain at least $5/month.
   - Checkout should use the configured Paystack currency and store amount, currency, reference, plan, status, and webhook event id.
   - Webhooks must be idempotent to prevent duplicate upgrades.

7. Security
   - Add a real privacy/security page before launch.
   - Use Supabase RLS policies for every user-owned table and storage object.
   - Add admin-only service-role operations server-side.
   - Add malware/file-type scanning or a managed upload scanning step before storing sensitive documents long-term.

## Verification Checklist

- Build: `npm run build`
- API smoke: `npm run smoke:test`
- Browser flows checked:
  - Public landing loads.
  - Get Started opens account creation.
  - Sign in opens sign-in.
  - Pricing shows USD-first plans with KES equivalents.
  - Documents page shows stored documents and security status.
  - Essay page shows stored writing samples and no false missing-sample error.
  - Admin overview, ingestion, and audit sections load.

