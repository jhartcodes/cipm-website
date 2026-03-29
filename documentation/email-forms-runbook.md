# Email Forms Runbook (Contact + Request Proposal)

This is the single source of truth for how form submissions work in `cipm-astro`.

## Scope

- Forms covered:
  - `/contact` (`formId=contact`)
  - `/request-proposal` (`formId=request_proposal`)
- Submission storage: not persisted in Sanity.
- Delivery: server-side email send via Resend.
- Bot protection: Cloudflare Turnstile + honeypot + server-side validation.

## Architecture

- Frontend pages are static Astro pages.
- Each form is submitted via client-side `fetch()` to `POST /api/form-submit`.
- `src/pages/api/form-submit.ts` is server-side (`prerender = false`) and runs on Netlify Functions.
- Server route responsibilities:
  - Enforce valid `formId`
  - Enforce honeypot
  - Verify Turnstile token
  - Validate payload with Zod
  - Build email content
  - Send email through Resend API
  - Return JSON success/error for UI feedback

## Code Map

- API route: `src/pages/api/form-submit.ts`
- Validation schemas: `src/lib/forms/schemas.ts`
- Turnstile verification: `src/lib/forms/turnstile.ts`
- Email send helper: `src/lib/email/sendEmail.ts`
- Contact form UI: `src/components/sections/contact/ContactFormSection.astro`
- Request proposal form UI: `src/components/sections/requestProposal/RequestProposalFormSection.astro`

## Validation Rules (Current)

- Shared:
  - `formId`: `contact` or `request_proposal`
  - `name`: min 2 chars
  - `email`: valid email format
  - `turnstileToken`: required
- Contact:
  - `message`: min 10 chars
  - `phone`: optional text
- Request proposal:
  - `phone`: required, min 7 chars
  - `propertyType`: required
  - `bestTimeToCall`, `buildingSize`, `buildingAddress`, `heardAboutUs`, `additionalInfo`: optional

## Required Environment Variables

Set in Netlify Site Settings -> Environment variables:

- `PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`
- `CONTACT_FROM`
- `CONTACT_TO`

Optional:

- `CONTACT_BCC` (comma-separated; useful during testing)
- `CONTACT_SUBJECT_CONTACT`
- `CONTACT_SUBJECT_PROPOSAL`

Local `.env` example:

```bash
PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
RESEND_API_KEY=...
CONTACT_FROM=hello@yourdomain.com
CONTACT_TO=hello@yourdomain.com
CONTACT_BCC=
CONTACT_SUBJECT_CONTACT=
CONTACT_SUBJECT_PROPOSAL=
```

## Client Account Setup Checklist

Complete these steps in the client-owned accounts before launch.

### 1) Domain + DNS (Cloudflare or DNS provider)

- Use client domain for production sending identity (recommended).
- Ensure DNS can host Resend DNS records and Turnstile widget hostname coverage.

### 2) Resend Setup (Sending)

- Create/confirm client Resend account access.
- Add sender domain in Resend.
- Add required DNS records in DNS provider (SPF/DKIM per Resend instructions).
- Wait for verification in Resend dashboard.
- Create API key with email send permission.
- Set in Netlify as `RESEND_API_KEY`.
- Set `CONTACT_FROM` to verified sender address on that domain.

### 3) Cloudflare Turnstile Setup (Bot Protection)

- Create a Turnstile site in client account.
- Add allowed hostnames:
  - Netlify production domain
  - Any custom domain(s)
  - Preview domain(s) if needed
  - `localhost` for local dev testing
- Copy Site Key -> `PUBLIC_TURNSTILE_SITE_KEY`.
- Copy Secret Key -> `TURNSTILE_SECRET_KEY`.

### 4) Netlify Setup

- Add all env vars listed above.
- Redeploy site after key changes.
- Confirm function route responds:
  - `POST /api/form-submit`

## Testing Checklist

### Functional

- Submit Contact form successfully.
- Submit Request Proposal form successfully.
- Confirm success message appears below submit button.
- Confirm received emails for each form.
- Confirm subject lines are correct per form.
- Confirm `reply-to` uses submitter email.

### Validation UX

- Contact message shorter than 10 chars shows validation message.
- Missing required fields show field-level validation.
- Invalid email format is blocked.

### Bot Protection

- Submit without Turnstile token is rejected.
- Reusing a token fails (expected `timeout-or-duplicate`).
- Honeypot value filled should not send an email.

## Troubleshooting

- Error: `Turnstile verification failed` with `timeout-or-duplicate`
  - Cause: expired/reused token.
  - Action: complete Turnstile again and resubmit.
- Error: `Unable to submit form right now. Please try again.`
  - Check Netlify function logs for root cause.
  - Verify required env vars exist in Netlify.
- Resend send failure
  - Confirm sender domain verification is complete.
  - Confirm `CONTACT_FROM` is from verified domain.
  - Confirm `RESEND_API_KEY` is valid.

## Security Notes

- Never expose `TURNSTILE_SECRET_KEY` or `RESEND_API_KEY` client-side.
- Keep all submission validation server-side (already implemented).
- Rotate API keys when client team changes.
- Remove `CONTACT_BCC` once testing is complete.

## Out of Scope

- No form submission persistence in Sanity.
- No external address autocomplete integration for building address.
