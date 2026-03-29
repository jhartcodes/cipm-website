# CIPM Astro + Sanity

This frontend is part of a two-app Sanity setup:

- [`/Users/joel/Personal/CIPM/cipm-astro`](/Users/joel/Personal/CIPM/cipm-astro): public site + dedicated Presentation frontend
- [`/Users/joel/Personal/CIPM/studio-cipm-`](/Users/joel/Personal/CIPM/studio-cipm-): standalone Sanity Studio

This repository does **not** embed Sanity Studio into the Astro app. The Studio is deployed separately and the Astro app points Visual Editing overlays back to that Studio.

For Studio-specific deployment and Presentation configuration, see [`/Users/joel/Personal/CIPM/studio-cipm-/README.md`](/Users/joel/Personal/CIPM/studio-cipm-/README.md).

## Architecture

### Production site

- Purpose: public website
- Content perspective: `published`
- Visual Editing: off
- Output mode: `static`
- Crawlable: yes
- Sitemap: yes

### Preview / Presentation site

- Purpose: dedicated frontend for Sanity Presentation
- Content perspective: `drafts`
- Visual Editing: on
- Output mode: `server`
- Crawlable: no
- Sitemap: no

## Studio Local Workflow

- Hosted separately on Sanity
- Current canonical Studio URL: `https://cipm.sanity.studio`
- Uses the Presentation tool to iframe the preview deployment

## Why this setup

We intentionally keep the Studio standalone instead of embedding it into Astro.

Reasons:

- cleaner separation between editor tooling and frontend runtime
- easier to run a dedicated Presentation deployment
- lower risk than mixing Studio routing into the public Astro app
- simpler production behavior for SEO and crawling

Embedding Studio would still be valid if we ever want the Studio on the same domain, for example `https://example.com/studio`. That would be a different architecture, not an error correction to this one.

## Core Services

This frontend depends on a small set of external platforms. Each one has a specific responsibility in production.

### Sanity

- Stores and serves structured website content.
- Hosts the standalone Studio at `https://cipm.sanity.studio`.
- Powers the Presentation workflow for draft preview and click-to-edit overlays.
- Provides both published-content CDN reads and direct API reads for preview.

### Netlify

- Builds and deploys the Astro frontend.
- Hosts the public site and preview frontend.
- Runs Astro server routes through the Netlify adapter.
- Handles `POST /api/form-submit` through the generated Netlify `ssr` function rather than a manually named custom function.

Operationally:

- The browser calls `/api/form-submit`.
- Astro compiles [`src/pages/api/form-submit.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/pages/api/form-submit.ts) into the Netlify server bundle.
- In the local build output this is represented by:
  - [`/Users/joel/Personal/CIPM/cipm-astro/.netlify/build/pages/api/form-submit.astro.mjs`](/Users/joel/Personal/CIPM/cipm-astro/.netlify/build/pages/api/form-submit.astro.mjs)
  - [`/Users/joel/Personal/CIPM/cipm-astro/.netlify/v1/functions/ssr/ssr.mjs`](/Users/joel/Personal/CIPM/cipm-astro/.netlify/v1/functions/ssr/ssr.mjs)
- When debugging production form failures in Netlify, inspect the `ssr` function logs.

### Resend

- Sends transactional email for both lead forms.
- Runs only server-side through the API route.
- Requires a valid `RESEND_API_KEY`.
- Requires `CONTACT_FROM` to be on a verified sending domain with Resend DNS records configured correctly.
- Requires at least one recipient in `CONTACT_TO`.

### Cloudflare Turnstile

- Provides bot protection for both forms.
- Uses `PUBLIC_TURNSTILE_SITE_KEY` in the browser and `TURNSTILE_SECRET_KEY` on the server.
- Requires allowed hostnames to include every environment where forms are expected to work:
  - `localhost` for local development
  - Netlify preview URLs if preview testing is needed
  - the production custom domain

Important:

- If `PUBLIC_TURNSTILE_SITE_KEY` is missing on the frontend, the form still renders but submissions will fail because no valid Turnstile token can be generated.
- If `TURNSTILE_SECRET_KEY` is missing on the server, verification will fail in the API route.

## How Presentation works

1. A user opens the Sanity Studio Presentation tool.
2. The Studio iframes the preview deployment URL.
3. The preview deployment has `PUBLIC_SANITY_VISUAL_EDITING_ENABLED="true"`.
4. The Astro app fetches Sanity content using:
   - `perspective: "drafts"`
   - `stega: true`
   - `resultSourceMap: "withKeyArraySelector"`
   - `useCdn: false`
   - `SANITY_API_READ_TOKEN`
5. The `VisualEditing` component renders click-to-edit overlays.
6. Overlay clicks route editors back to the standalone Studio.

Important:

- Presentation is environment-wide on the preview deployment.
- We do **not** use per-request draft-mode cookies or URL heuristics.
- We disable Astro client-side transitions in the preview deployment because they broke overlays after navigation.

## Environments

| Environment | `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` | Behavior |
| --- | --- | --- |
| Local dev | `false` | normal published-content frontend |
| Local dev | `true` | local Presentation frontend |
| Preview deploy | `true` | dedicated Presentation frontend |
| Production deploy | `false` | public website |

## Current Sanity behavior

### Content CDN

All page content fetches go through [`src/lib/sanity/loadQuery.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/lib/sanity/loadQuery.ts).

- Preview / Presentation: `useCdn: false`
- Production: `useCdn: true`

This means:

- draft content is fetched directly from the Sanity API in preview
- published content uses the Sanity API CDN in production

### Asset CDN

Images are still served from Sanity's asset CDN at `cdn.sanity.io`.

## SEO and crawlability

Preview deployments must never be indexable.

That is enforced by:

- [`src/components/seo/SeoHead.astro`](/Users/joel/Personal/CIPM/cipm-astro/src/components/seo/SeoHead.astro)
  - preview forces `noindex, nofollow`
  - preview omits canonical URL tags
- [`src/pages/robots.txt.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/pages/robots.txt.ts)
  - preview returns `Disallow: /`
- [`astro.config.mjs`](/Users/joel/Personal/CIPM/cipm-astro/astro.config.mjs)
  - preview does not emit a sitemap

## Key files

### Astro app

- [`astro.config.mjs`](/Users/joel/Personal/CIPM/cipm-astro/astro.config.mjs)
  - switches between `server` and `static`
  - loads env vars with `loadEnv`
  - configures `@sanity/astro`
- [`src/lib/sanity/loadQuery.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/lib/sanity/loadQuery.ts)
  - central Sanity fetch helper
  - controls `drafts` vs `published`
  - controls `useCdn`
- [`src/layouts/BaseLayout.astro`](/Users/joel/Personal/CIPM/cipm-astro/src/layouts/BaseLayout.astro)
  - mounts `VisualEditing`
  - disables Astro transitions in preview mode
- [`src/components/seo/SeoHead.astro`](/Users/joel/Personal/CIPM/cipm-astro/src/components/seo/SeoHead.astro)
  - preview noindex rules
- [`src/pages/robots.txt.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/pages/robots.txt.ts)
  - preview crawl blocking

### Sanity-specific frontend conventions

- All Sanity page data should flow through [`src/lib/sanity/loadQuery.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/lib/sanity/loadQuery.ts).
- Shared GROQ queries live in [`src/lib/sanity/queries.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/lib/sanity/queries.ts).
- Image URLs are generated through [`src/lib/sanity/image.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/lib/sanity/image.ts).
- Internal Sanity link objects are converted to site URLs through [`src/lib/routing/resolveLink.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/lib/routing/resolveLink.ts).

These conventions matter because Presentation depends on route consistency:

- the frontend route map
- Studio `resolve.locations`
- Studio `resolve.mainDocuments`

all need to stay aligned.

### Studio app

- [`sanity.config.ts`](/Users/joel/Personal/CIPM/studio-cipm-/sanity.config.ts)
  - Presentation config
  - `previewUrl`
  - `resolve`
  - `allowOrigins`
- [`presentation/resolve.ts`](/Users/joel/Personal/CIPM/studio-cipm-/presentation/resolve.ts)
  - maps Sanity documents to Astro routes
- [`sanity.cli.ts`](/Users/joel/Personal/CIPM/studio-cipm-/sanity.cli.ts)
  - `studioHost`
  - `appId`
  - auto-updates config

## Environment variables

### `cipm-astro`

| Variable | Required | Purpose |
| --- | --- | --- |
| `PUBLIC_SANITY_PROJECT_ID` | yes | Sanity project ID |
| `PUBLIC_SANITY_DATASET` | yes | dataset name |
| `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` | yes | turns the deployment into either preview or production behavior |
| `PUBLIC_SANITY_STUDIO_URL` | yes | canonical Studio URL used by overlays |
| `SANITY_API_READ_TOKEN` | preview only | viewer token for draft content |
| `SITE_URL` or `URL` | recommended | site URL for canonical and sitemap generation |
| `RESEND_API_KEY` | forms only | server-side API key for transactional email |
| `CONTACT_FROM` | forms only | sender address used by Resend |
| `CONTACT_TO` | forms only | comma-separated primary recipients |
| `CONTACT_BCC` | optional | comma-separated BCC recipients |
| `PUBLIC_TURNSTILE_SITE_KEY` | forms only | browser-side Turnstile site key |
| `TURNSTILE_SECRET_KEY` | forms only | server-side Turnstile secret |

### `studio-cipm-`

| Variable | Required | Purpose |
| --- | --- | --- |
| `SANITY_STUDIO_VISUAL_EDITING_PREVIEW_URL` | yes | URL that Presentation iframes |
| `SANITY_STUDIO_VISUAL_EDITING_ALLOW_ORIGINS` | optional | extra trusted origins for staging or additional preview frontends |
| `SANITY_STUDIO_HOSTNAME` | optional | hosted Studio hostname, defaults to `cipm` |
| `SANITY_STUDIO_APP_ID` | recommended | specific Studio app for Sanity-managed deployment settings |

## Local workflow

### Frontend

```sh
cd /Users/joel/Personal/CIPM/cipm-astro
npm install
npm run dev
```

Local behavior depends entirely on `PUBLIC_SANITY_VISUAL_EDITING_ENABLED`.

### Route strategy

This Astro app uses a mixed route strategy:

- static-style published pages for the production site
- server-rendered behavior for Presentation preview
- explicit SSR routes for dynamic content and form handling

Notable routes:

- [`src/pages/blog/index.astro`](/Users/joel/Personal/CIPM/cipm-astro/src/pages/blog/index.astro): SSR for pagination/filtering
- [`src/pages/blog/[slug].astro`](/Users/joel/Personal/CIPM/cipm-astro/src/pages/blog/[slug].astro): dynamic blog posts
- [`src/pages/services/[slug].astro`](/Users/joel/Personal/CIPM/cipm-astro/src/pages/services/[slug].astro): dynamic service pages
- [`src/pages/api/form-submit.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/pages/api/form-submit.ts): server endpoint for forms

## Forms, Turnstile, and Resend

The site has two lead forms:

- contact form
- request proposal form

Both submit to [`src/pages/api/form-submit.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/pages/api/form-submit.ts).

### Public endpoint vs Netlify function

The forms do not submit directly to `/.netlify/functions/...`.

- The browser sends `POST` requests to `/api/form-submit`.
- Astro maps that route to the server-side page API module in [`src/pages/api/form-submit.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/pages/api/form-submit.ts).
- On Netlify, the adapter bundles that route into the generated `ssr` function.

This matters for debugging:

- In browser devtools, you should expect to see `/api/form-submit`.
- In Netlify logs, you should expect the request to show up under the `ssr` function.

### Form flow

1. The browser submits JSON to `/api/form-submit`.
2. The request includes:
   - `formId`
   - form fields
   - a honeypot field
   - a Cloudflare Turnstile token
3. The API route:
   - validates `formId`
   - silently accepts honeypot spam
   - verifies the Turnstile token
   - validates payload shape with Zod
   - sends an email through Resend

### Validation

Schemas live in [`src/lib/forms/schemas.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/lib/forms/schemas.ts).

- `contactFormSchema`
- `requestProposalFormSchema`

Server validation is the actual source of truth. Client-side validation improves UX only and should not be treated as a security boundary.

### Turnstile

Turnstile verification lives in [`src/lib/forms/turnstile.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/lib/forms/turnstile.ts).

- browser uses `PUBLIC_TURNSTILE_SITE_KEY`
- server verifies with `TURNSTILE_SECRET_KEY`

Operational notes:

- Turnstile hostnames must match the real frontend hostname where the widget is rendered.
- A missing or expired token is rejected before any email send is attempted.
- Reused tokens can fail with `timeout-or-duplicate`, which is expected behavior.

### Resend

Resend integration lives in [`src/lib/email/sendEmail.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/lib/email/sendEmail.ts).

Behavior:

- sends email via `https://api.resend.com/emails`
- requires `RESEND_API_KEY`
- requires `CONTACT_FROM`
- requires at least one `CONTACT_TO`
- optionally includes `CONTACT_BCC`
- uses the form submitter email as `reply_to`

This `reply_to` pattern is intentional and preferred. The email is sent from the verified site/domain address, and replies go back to the person who submitted the form.

Subjects are set in [`src/pages/api/form-submit.ts`](/Users/joel/Personal/CIPM/cipm-astro/src/pages/api/form-submit.ts):

- contact form: `CONTACT_SUBJECT_CONTACT` fallback
- request proposal form: `CONTACT_SUBJECT_PROPOSAL` fallback

### Operational notes

- Resend runs only server-side through the API route.
- The Resend API key must never be exposed to the client.
- The Turnstile secret must never be exposed to the client.
- A build passing does not prove forms will work in production; production success still depends on Turnstile hostname configuration, Resend sender-domain verification, and the Netlify environment variables.
- If forms stop working, check:
  1. Turnstile keys
  2. Resend API key
  3. recipient env vars
  4. Turnstile allowed hostnames
  5. Resend sender-domain verification and DNS
  6. Netlify `ssr` function/server logs

## Privacy Policy

The current privacy policy page is a hardcoded Astro page:

- route: [`src/pages/privacy-policy.astro`](/Users/joel/Personal/CIPM/cipm-astro/src/pages/privacy-policy.astro)

Current behavior:

- The policy copy is written directly in code.
- The effective date is hardcoded.
- The contact address, phone number, and email are hardcoded.
- The page is not modeled in Sanity.

Implications:

- Any content update currently requires a code change and deploy.
- Non-developers cannot update the privacy policy through Sanity Studio.
- Legal/policy copy is less maintainable than the rest of the site content.

Recommended direction:

- Treat the privacy policy as customizable content.
- Move it into Sanity as a singleton page or policy document.
- Use Portable Text for the policy body and structured fields for metadata like effective date and contact information.
- Keep the frontend route, but source the content from Sanity instead of hardcoding it in the Astro page.

### Studio

```sh
cd /Users/joel/Personal/CIPM/studio-cipm-
npm install
npm run dev
```

## Builds

Frontend:

```sh
cd /Users/joel/Personal/CIPM/cipm-astro
npm run build
```

Studio:

```sh
cd /Users/joel/Personal/CIPM/studio-cipm-
npm run build
```

Note:

- `npm run preview` is not useful here because the Netlify adapter does not support `astro preview`.
- To validate the real preview deployment behavior, deploy the site and test it in Presentation.

## Deployment checklist

### Preview / Presentation deployment

- `PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true`
- `SANITY_API_READ_TOKEN` set
- `PUBLIC_SANITY_STUDIO_URL=https://cipm.sanity.studio`
- deployed URL matches `SANITY_STUDIO_VISUAL_EDITING_PREVIEW_URL` in the Studio

### Production deployment

- `PUBLIC_SANITY_VISUAL_EDITING_ENABLED=false`
- no preview token required
- canonical site URL configured
- form env vars configured if forms should remain live

### Studio deployment

- `SANITY_STUDIO_APP_ID` configured
- `SANITY_STUDIO_VISUAL_EDITING_PREVIEW_URL` points at the preview deployment
- extra preview origins added through `SANITY_STUDIO_VISUAL_EDITING_ALLOW_ORIGINS` if needed

## If Presentation breaks

Check these first:

1. Does the preview deployment have `PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true`?
2. Does the preview deployment have a valid `SANITY_API_READ_TOKEN`?
3. Does `PUBLIC_SANITY_STUDIO_URL` point to the canonical Studio URL, not the `www.sanity.io/@...` dashboard URL?
4. Does Studio `allowOrigins` include the preview origin?
5. Did someone re-enable Astro client-side transitions on the preview deployment?

## If forms break

Check these first:

1. Is `/api/form-submit` deployed and reachable?
2. Is `PUBLIC_TURNSTILE_SITE_KEY` present in the frontend?
3. Is `TURNSTILE_SECRET_KEY` present on the server?
4. Is `RESEND_API_KEY` valid?
5. Are `CONTACT_FROM` and `CONTACT_TO` configured?
6. Does Turnstile allow the real production hostname?
7. Is `CONTACT_FROM` on a verified Resend domain with working SPF/DKIM?
8. If checking Netlify logs, are you looking at the `ssr` function?

## References

- [Build your blog with Astro and Sanity](https://www.sanity.io/docs/developer-guides/sanity-astro-blog)
- [The Presentation tool](https://www.sanity.io/docs/visual-editing/configuring-the-presentation-tool)
- [Embedding Sanity Studio](https://www.sanity.io/docs/studio/embedding-sanity-studio)
- [Studio deployment](https://www.sanity.io/docs/studio/deployment)
- [Sanity JavaScript client CDN configuration](https://www.sanity.io/docs/js-client-cdn-configuration)
- [Resend API](https://resend.com/docs/api-reference/emails/send-email)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
