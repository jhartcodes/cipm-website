# Contact + Request Proposal Implementation TODO

## Scope

- Build a reusable server-side email submission flow for `contact` and `request_proposal`.
- Keep Sanity for page/content config and property type options.
- Do **not** store form submissions in Sanity (per current requirement).

## Current Code Audit (as-is)

- Contact form is currently Netlify Forms HTML posting:
  - `src/components/sections/contact/ContactFormSection.astro`
  - Uses `data-netlify="true"`, `netlify-honeypot`, and redirect `action="/contact?success=true"`.
- No custom API route or Netlify function exists for form submission.
- No Turnstile integration exists in frontend or server.
- No server-side validation exists for form payloads.
- No Resend API usage exists in app code.
- Existing env keys are Sanity-focused plus `RESEND_MAIL_SMTP`; no Turnstile or contact routing vars are defined.

## Architecture Revisions (based on code + requirements)

- Replace Netlify Forms submission with one shared server endpoint:
  - `POST /api/form-submit` (Astro server route; Netlify adapter will run it server-side).
- Standardize by `formId`:
  - `contact`
  - `request_proposal`
- Validation strategy:
  - Use `zod` with one schema per form + shared base fields.
  - Rationale: now two forms, differing required fields, and stronger maintainability than manual ad hoc checks.
- Bot protection:
  - Turnstile token verified server-side.
  - Honeypot enforced server-side.
  - FormId whitelist and POST-only handling.
- Email sending:
  - Resend API via server route (not SMTP from browser).
  - `from` = verified domain sender.
  - `replyTo` = submitter email.
  - `bcc` configurable and enabled only in test/staging.

## Implementation TODO

### Phase 1: Server Infrastructure

- [ ] Add dependency: `zod`.
- [ ] Create `src/lib/forms/schemas.ts`:
  - [ ] Shared base schema (`formId`, `name`, `email`, honeypot, turnstile token).
  - [ ] `contact` schema.
  - [ ] `request_proposal` schema.
- [ ] Create `src/lib/forms/turnstile.ts`:
  - [ ] Verify token against Cloudflare Turnstile API.
  - [ ] Return typed pass/fail result.
- [ ] Create `src/lib/email/sendEmail.ts`:
  - [ ] Centralized Resend send helper.
  - [ ] Supports subject/from/to/replyTo/bcc.
  - [ ] Standardized error mapping for route responses.
- [ ] Create `src/pages/api/form-submit.ts`:
  - [ ] Reject non-POST.
  - [ ] Parse `application/json`.
  - [ ] Enforce `formId` whitelist (`contact`, `request_proposal`).
  - [ ] Enforce honeypot.
  - [ ] Verify Turnstile server-side.
  - [ ] Validate payload with `zod`.
  - [ ] Route to email template builder by `formId`.
  - [ ] Send email via Resend.
  - [ ] Return structured JSON `{ok, message}`.

### Phase 2: Contact Form Migration

- [ ] Refactor `src/components/sections/contact/ContactFormSection.astro`:
  - [ ] Remove Netlify Forms attributes (`data-netlify`, `form-name`, old action redirect).
  - [ ] Submit to `/api/form-submit` via JS fetch.
  - [ ] Include hidden honeypot + Turnstile token field.
  - [ ] Add inline success/error states from JSON response.
  - [ ] Keep existing visual style.

### Phase 3: Request Proposal Page

- [ ] Add query for property type options from Sanity:
  - [ ] New query in `src/lib/sanity/queries.ts` for property type list.
- [ ] Create page route `src/pages/request-proposal.astro`:
  - [ ] Load property type options.
  - [ ] Use existing page layout/hero pattern.
- [ ] Create form section component:
  - [ ] `src/components/sections/requestProposal/RequestProposalFormSection.astro`
  - [ ] Fields: `name`, `email`, `phone` required; other requested fields optional.
  - [ ] `propertyType` select populated from Sanity query.
  - [ ] Submit with `formId="request_proposal"` to same endpoint.
  - [ ] Shared styling with contact form inputs/buttons.

### Phase 4: Config + Environment

- [ ] Add and document env keys:
  - [ ] `PUBLIC_TURNSTILE_SITE_KEY`
  - [ ] `TURNSTILE_SECRET_KEY`
  - [ ] `RESEND_API_KEY`
  - [ ] `CONTACT_FROM`
  - [ ] `CONTACT_TO`
  - [ ] `CONTACT_BCC` (temporary testing only)
- [ ] Add fail-fast startup checks for required server env vars in submit handler.
- [ ] Add `documentation/contact-form-env.md` with local/dev/prod setup notes.

### Phase 5: QA + Hardening

- [ ] Unit test schemas (valid/invalid payloads).
- [ ] Route tests for:
  - [ ] missing token
  - [ ] bad turnstile token
  - [ ] honeypot filled
  - [ ] invalid formId
  - [ ] valid contact submit
  - [ ] valid request proposal submit
- [ ] Manual e2e in Netlify deploy preview:
  - [ ] contact success
  - [ ] request proposal success
  - [ ] reply-to verified
  - [ ] temporary BCC received

## Out of Scope (for this requirement)

- No Sanity persistence for submissions.
- No `requestProposalSubmission` schema needed unless requirements change.

## Decisions Needed Before Implementation Starts

- [ ] Confirm endpoint name: `/api/form-submit` (or preferred path).
- [ ] Confirm whether `CONTACT_TO` should be same for both forms or split by form:
  - e.g. `CONTACT_TO_CONTACT` and `CONTACT_TO_PROPOSAL`.
- [ ] Confirm final subject lines:
  - contact: `"[Website] Contact Form - {name}"`
  - proposal: `"[Website] Request Proposal - {name}"`
- [ ] Confirm temporary BCC behavior:
  - enabled only in non-production, or enabled in production until launch sign-off.
- [ ] Confirm if `bestTimeToCall` should be normalized to a fixed set (enum) or free text.
- [ ] Confirm if `buildingSize` should be free text or structured units (sq ft + unit).

## Decisions Confirmed During Implementation

- Endpoint is `/api/form-submit`.
- Same recipient is used for both forms (`CONTACT_TO`).
- Subject lines are different per form:
  - Contact: `[Website] Contact Form - {name}`
  - Request proposal: `[Website] Request Proposal - {name}`
- `bestTimeToCall` is free text.
- `buildingSize` is free text.
- Submission persistence in Sanity is not implemented.
