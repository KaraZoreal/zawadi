# Changelog

## 2026-05-23

- Audited the public landing flow, authenticated workspace, pricing, document vault, essay generator, admin console, scholarship ingestion, billing state, and smoke-test coverage.
- Clarified public entry behavior: Get Started opens account creation, Sign in opens sign-in, and landing pricing cards route users into account creation before checkout.
- Standardized pricing copy to USD-first paid plans with local KES equivalents in the authenticated pricing page; cheapest paid plan is now shown as $5/month.
- Hardened plan downgrade behavior: paid users now see lower tiers as included, and lower-tier checkout is blocked server-side to avoid subscription/account mismatches.
- Improved the admin console design with a stronger operations layout, a darker sidebar, visible Ingestion and Audit sections, category/source panels, and clearer subscription revenue labels.
- Confirmed the essay sample upload pipeline with DOCX/PDF extraction, rejection of unsupported files, and stored writing samples for generation.
- Confirmed document vault persistence and added visible security posture cues for private storage, session cookies, and payment verification.
- Added browser verification screenshots under `artifacts/` for the landing page, admin console, and document vault.

### Verification

- `npm run build` passes. The main bundle is currently about 509 kB minified and should be code-split before production launch.
- `npm run smoke:test` passes, including essay sample extraction, non-essay rejection, admin subscription updates, and admin dashboard compatibility.
