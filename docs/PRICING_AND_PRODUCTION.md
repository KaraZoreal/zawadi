# Pricing And Production Notes

## Recommended Pricing

Use a freemium model:

- Explorer: free forever.
- Scholar Plus: KES 399/month or KES 3,990/year.
- Application Pro: KES 999/month or KES 9,990/year.
- Mentor Review: KES 2,999/month or KES 29,990/year.

The reasoning:

- Scholarship search has to stay free enough to build trust. Going Merry presents student scholarship matching and tracking as free, so Zawadi should not hide the basic database behind a paywall.
- Paid value should sit in workflow power: premium filters, match scoring, document gap analysis, unlimited tracking, reminders and exports.
- US education SaaS pricing is much higher, but that is not the right anchor for African student applicants. KES 399 is a low-friction monthly price for serious applicants, while KES 999 captures heavier users managing many countries and documents.
- Paystack Kenya fees are material but manageable at these prices: M-PESA is listed at 1.5%, local cards at 2.9%, and international cards at 3.8%. Absorb fees at launch to keep checkout simple.

Sources used:

- Going Merry: https://apps.apple.com/us/app/going-merry-scholarships/id1483037600
- Going Merry support: https://support.goingmerry.com/en/articles/7180130-parents-how-do-i-find-and-apply-for-scholarships
- ScholarshipOwl FAQ: https://scholarshipowl.com/faq
- Paystack transaction pricing: https://support.paystack.com/en/articles/2130306
- Paystack transactions API: https://paystack.com/docs/api/transaction/
- Paystack subscriptions: https://paystack.com/docs/payments/subscriptions/

## Supabase Setup

The app is wired for Supabase Auth and Supabase Storage but still runs locally without secrets.

Required variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Create a private storage bucket named `documents`. The client uploads each file to:

```text
{userId}/{timestamp}-{fileName}
```

Supabase Storage requires row-level policies before authenticated uploads work. A production policy should restrict inserts, selects and deletes to paths where the first folder equals the authenticated user id.

References:

- Supabase Auth: https://supabase.com/docs/guides/auth/
- Supabase sign in with password: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
- Supabase storage upload: https://supabase.com/docs/reference/javascript/v1/storage-from-upload
- Supabase storage access control: https://supabase.com/docs/guides/storage/security/access-control

## Paystack Setup

Required variables:

```text
PAYSTACK_SECRET_KEY=
PAYSTACK_CALLBACK_URL=
PAYSTACK_PLUS_MONTHLY_PLAN_CODE=
PAYSTACK_PLUS_ANNUAL_PLAN_CODE=
PAYSTACK_PRO_MONTHLY_PLAN_CODE=
PAYSTACK_PRO_ANNUAL_PLAN_CODE=
PAYSTACK_MENTOR_MONTHLY_PLAN_CODE=
PAYSTACK_MENTOR_ANNUAL_PLAN_CODE=
```

The checkout endpoint initializes a transaction on the server and redirects the user to Paystack. If a plan code is present, it is included for recurring billing. The webhook endpoint validates the `x-paystack-signature` HMAC before marking a plan active.

References:

- Paystack initialize transaction: https://paystack.com/docs/api/transaction/
- Paystack subscriptions and plans: https://paystack.com/docs/payments/subscriptions/
- Paystack webhooks: https://paystack.com/docs/payments/webhooks
